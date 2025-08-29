import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { GenerationResult } from '../agents/types.js';

export interface SimulationMetadata {
  uuid: string;
  name: string;
  description: string;
  createdAt: string;
  outputDir: string;
  simulationPath: string;
  template: string;
  status: 'generated' | 'running' | 'stopped' | 'error';
  lastExecuted?: string;
  generationResult?: GenerationResult;
}

export class SimulationRegistry {
  private registryPath: string;
  private simulations: Map<string, SimulationMetadata> = new Map();

  constructor(registryPath?: string) {
    this.registryPath = registryPath || join(process.cwd(), '.sim-registry.json');
    this.loadRegistry();
  }

  /**
   * Register a new simulation with a UUID
   */
  registerSimulation(
    name: string, 
    description: string, 
    outputDir: string, 
    template: string,
    generationResult?: GenerationResult
  ): string {
    const uuid = randomUUID();
    const simulationPath = join(outputDir, name);
    
    const metadata: SimulationMetadata = {
      uuid,
      name,
      description,
      createdAt: new Date().toISOString(),
      outputDir,
      simulationPath,
      template,
      status: 'generated',
      generationResult
    };

    this.simulations.set(uuid, metadata);
    this.saveRegistry();
    
    return uuid;
  }

  /**
   * Get simulation metadata by UUID
   */
  getSimulation(uuid: string): SimulationMetadata | undefined {
    return this.simulations.get(uuid);
  }

  /**
   * List all registered simulations
   */
  getAllSimulations(): SimulationMetadata[] {
    return Array.from(this.simulations.values());
  }

  /**
   * Update simulation status
   */
  updateSimulationStatus(uuid: string, status: SimulationMetadata['status']): void {
    const simulation = this.simulations.get(uuid);
    if (simulation) {
      simulation.status = status;
      if (status === 'running') {
        simulation.lastExecuted = new Date().toISOString();
      }
      this.saveRegistry();
    }
  }

  /**
   * Remove a simulation from registry
   */
  unregisterSimulation(uuid: string): boolean {
    const removed = this.simulations.delete(uuid);
    if (removed) {
      this.saveRegistry();
    }
    return removed;
  }

  /**
   * Find simulations by name or description
   */
  findSimulations(searchTerm: string): SimulationMetadata[] {
    const term = searchTerm.toLowerCase();
    return Array.from(this.simulations.values()).filter(sim => 
      sim.name.toLowerCase().includes(term) || 
      sim.description.toLowerCase().includes(term)
    );
  }

  /**
   * Load registry from file
   */
  private loadRegistry(): void {
    if (existsSync(this.registryPath)) {
      try {
        const data = readFileSync(this.registryPath, 'utf-8');
        const registryData = JSON.parse(data);
        this.simulations = new Map(Object.entries(registryData));
      } catch (error) {
        console.warn('Failed to load simulation registry, starting with empty registry:', error);
        this.simulations = new Map();
      }
    }
  }

  /**
   * Save registry to file
   */
  private saveRegistry(): void {
    try {
      const registryData = Object.fromEntries(this.simulations);
      writeFileSync(this.registryPath, JSON.stringify(registryData, null, 2));
    } catch (error) {
      console.error('Failed to save simulation registry:', error);
    }
  }

  /**
   * Get registry file path
   */
  getRegistryPath(): string {
    return this.registryPath;
  }
}

// Global registry instance
export const simulationRegistry = new SimulationRegistry();