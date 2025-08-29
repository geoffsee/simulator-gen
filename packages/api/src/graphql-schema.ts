import { createSchema, createYoga } from 'graphql-yoga'
import { SimulationGeneratorCLI } from '../../sim-generator/src/cli.ts'
import { simulationRegistry } from '../../sim-generator/src/utils/simulation-registry.ts'
import { spawn } from 'child_process'
import { join } from 'path'

// Initialize CLI instance
const simulatorCLI = new SimulationGeneratorCLI()

export default createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
        getSimulation(uuid: String!): Simulation
        listSimulations: [Simulation!]!
        findSimulations(searchTerm: String!): [Simulation!]!
      }

      type Mutation {
        generateSimulation(input: SimulationGenerationInput!): SimulationGenerationResult!
        invokeSimulation(uuid: String!): SimulationInvocationResult!
      }

      input SimulationGenerationInput {
        description: String!
        outputDir: String
        name: String
        template: String
        interactive: Boolean
        verbose: Boolean
        dryRun: Boolean
        config: String
      }

      type SimulationGenerationResult {
        success: Boolean!
        message: String!
        uuid: String
        simulationName: String
        outputPath: String
        error: String
      }

      type Simulation {
        uuid: String!
        name: String!
        description: String!
        createdAt: String!
        outputDir: String!
        simulationPath: String!
        template: String!
        status: SimulationStatus!
        lastExecuted: String
      }

      enum SimulationStatus {
        GENERATED
        RUNNING
        STOPPED
        ERROR
      }

      type SimulationInvocationResult {
        success: Boolean!
        message: String!
        uuid: String
        status: SimulationStatus
        error: String
      }
    `,
    resolvers: {
        Query: {
            greetings: () => 'Hello from Yoga in a Bun app!',
            getSimulation: (_, { uuid }) => {
                const simulation = simulationRegistry.getSimulation(uuid);
                if (!simulation) {
                    return null;
                }
                return {
                    ...simulation,
                    status: simulation.status.toUpperCase()
                };
            },
            listSimulations: () => {
                const simulations = simulationRegistry.getAllSimulations();
                return simulations.map(sim => ({
                    ...sim,
                    status: sim.status.toUpperCase()
                }));
            },
            findSimulations: (_, { searchTerm }) => {
                const simulations = simulationRegistry.findSimulations(searchTerm);
                return simulations.map(sim => ({
                    ...sim,
                    status: sim.status.toUpperCase()
                }));
            }
        },
        Mutation: {
            generateSimulation: async (_, { input }) => {
                try {
                    // Convert GraphQL input to CLI options format
                    const options = {
                        'output-dir': input.outputDir,
                        'name': input.name,
                        'template': input.template,
                        'interactive': input.interactive || false,
                        'verbose': input.verbose || false,
                        'dry-run': input.dryRun || false,
                        'config': input.config
                    }

                    // Call the CLI generate method and get the UUID
                    const uuid = await simulatorCLI.generate(input.description, options)

                    // If we reach here, generation was successful
                    const simulationName = input.name || 'generated-simulation'
                    const outputPath = input.outputDir || process.cwd()

                    return {
                        success: true,
                        message: `Simulation "${simulationName}" generated successfully!`,
                        uuid,
                        simulationName,
                        outputPath: `${outputPath}/${simulationName}`,
                        error: null
                    }
                } catch (error) {
                    return {
                        success: false,
                        message: 'Failed to generate simulation',
                        uuid: null,
                        simulationName: null,
                        outputPath: null,
                        error: error instanceof Error ? error.message : String(error)
                    }
                }
            },
            invokeSimulation: async (_, { uuid }) => {
                try {
                    // Find the simulation by UUID
                    const simulation = simulationRegistry.getSimulation(uuid);
                    if (!simulation) {
                        return {
                            success: false,
                            message: `Simulation with UUID ${uuid} not found`,
                            uuid,
                            status: null,
                            error: 'Simulation not found in registry'
                        };
                    }

                    // Check if simulation directory exists
                    const { existsSync } = await import('fs');
                    if (!existsSync(simulation.simulationPath)) {
                        return {
                            success: false,
                            message: `Simulation directory not found: ${simulation.simulationPath}`,
                            uuid,
                            status: 'ERROR',
                            error: 'Simulation directory does not exist'
                        };
                    }

                    // Update status to running
                    simulationRegistry.updateSimulationStatus(uuid, 'running');

                    // Execute the simulation (run bun run dev in the simulation directory)
                    const child = spawn('bun', ['run', 'dev'], {
                        cwd: simulation.simulationPath,
                        detached: true,
                        stdio: 'ignore'
                    });

                    // Handle process events
                    child.on('error', (error) => {
                        console.error(`Failed to start simulation ${uuid}:`, error);
                        simulationRegistry.updateSimulationStatus(uuid, 'error');
                    });

                    child.on('exit', (code) => {
                        if (code === 0) {
                            simulationRegistry.updateSimulationStatus(uuid, 'stopped');
                        } else {
                            simulationRegistry.updateSimulationStatus(uuid, 'error');
                        }
                    });

                    // Detach the child process so it runs independently
                    child.unref();

                    return {
                        success: true,
                        message: `Simulation "${simulation.name}" started successfully`,
                        uuid,
                        status: 'RUNNING',
                        error: null
                    };

                } catch (error) {
                    // Update status to error if something goes wrong
                    simulationRegistry.updateSimulationStatus(uuid, 'error');
                    
                    return {
                        success: false,
                        message: 'Failed to invoke simulation',
                        uuid,
                        status: 'ERROR',
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            }
        }
    }
})