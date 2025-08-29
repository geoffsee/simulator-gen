import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { GenerationResult, GeneratedFile } from '../agents/types.js';

export interface BasicProjectConfig {
  name: string;
  outputDir: string;
  template: string;
}

export class SimulationGenerator {
  
  async createSimulationPackage(result: GenerationResult): Promise<void> {
    const packageDir = join(result.outputDir, result.simulationName);
    
    // Create the main package directory
    this.ensureDirectory(packageDir);
    
    // Write all generated files
    for (const file of result.files) {
      const filePath = join(packageDir, file.path);
      this.ensureDirectory(dirname(filePath));
      
      try {
        writeFileSync(filePath, file.content, 'utf-8');
        console.log(`✓ Created ${file.path}`);
      } catch (error) {
        console.error(`Failed to write ${file.path}:`, error);
        throw error;
      }
    }
    
    // Create additional directories that might be needed
    this.ensureDirectory(join(packageDir, 'src'));
    this.ensureDirectory(join(packageDir, 'dist'));
    
    console.log(`\n📦 Package created successfully at: ${packageDir}`);
  }

  async createBasicProject(config: BasicProjectConfig): Promise<void> {
    const projectDir = join(config.outputDir, config.name);
    
    // Create project structure
    this.ensureDirectory(projectDir);
    this.ensureDirectory(join(projectDir, 'src'));
    
    // Create basic package.json
    const packageJson = {
      name: config.name,
      version: '1.0.0',
      description: `Basic simulation project: ${config.name}`,
      main: 'dist/index.js',
      module: 'src/index.ts',
      type: 'module',
      scripts: {
        build: 'tsc',
        dev: 'tsx src/index.ts',
        start: 'node dist/index.js',
        test: 'bun test'
      },
      dependencies: {
        '../../lib': 'workspace:*'
      },
      devDependencies: {
        '@types/bun': 'latest',
        'tsx': '^4.0.0',
        'typescript': '^5.0.0'
      }
    };
    
    writeFileSync(
      join(projectDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create basic TypeScript config
    const tsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    writeFileSync(
      join(projectDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    // Create basic index.ts
    const indexContent = `/**
 * ${config.name} - Basic Simulation
 */

import { createSimulation, Event } from '../../lib/src/lib.js';

// Define basic state and event types
export type BasicState = 'Initial' | 'Processing' | 'Complete';

export enum BasicEventType {
  START = 'start',
  PROCESS = 'process', 
  COMPLETE = 'complete'
}

export interface BasicEvent extends Event<BasicEventType> {}

// Create the simulation
const simulation = createSimulation<BasicState, BasicEvent>({
  initialState: 'Initial',
  allowedTransitions: {
    'Initial': ['Processing'],
    'Processing': ['Complete'],
    'Complete': []
  },
  handleEvent: (event: BasicEvent) => {
    console.log(\`Processing event: \${event.type}\`, event);
  },
  eventGenerators: [
    // Basic event generators
    () => ({
      id: 'evt-' + Math.random().toString(36).substr(2, 9),
      type: BasicEventType.START,
      timestamp: new Date().toISOString(),
      payload: {}
    }),
    () => ({
      id: 'evt-' + Math.random().toString(36).substr(2, 9),
      type: BasicEventType.PROCESS,
      timestamp: new Date().toISOString(),
      payload: { data: Math.random() }
    })
  ]
});

// Export simulation
export { simulation };

// Start simulation if running directly
if (import.meta.main) {
  console.log('Starting ${config.name} simulation...');
  simulation.start({ 
    minInterval: 1000, 
    maxInterval: 3000,
    enableLogging: true
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\nStopping simulation...');
    simulation.stop();
    process.exit(0);
  });
}`;
    
    writeFileSync(join(projectDir, 'src', 'index.ts'), indexContent);
    
    // Create basic README
    const readmeContent = `# ${config.name}

A basic simulation project created with sim-generator.

## Installation

\`\`\`bash
bun install
\`\`\`

## Usage

\`\`\`bash
# Run in development mode
bun run dev

# Build for production
bun run build

# Run built version
bun start
\`\`\`

## Next Steps

1. Use \`sim-generate enhance ${config.name}\` to get AI-powered suggestions
2. Modify the simulation logic in \`src/index.ts\`
3. Add more event types and generators
4. Customize state transitions

Generated at: ${new Date().toISOString()}
`;
    
    writeFileSync(join(projectDir, 'README.md'), readmeContent);
    
    console.log(`\n📁 Basic project created at: ${projectDir}`);
  }

  private ensureDirectory(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  // Utility method to validate generated files
  validateGeneratedFiles(files: GeneratedFile[]): string[] {
    const errors: string[] = [];
    
    // Check for required files
    const requiredFiles = ['package.json', 'src/index.ts', 'tsconfig.json'];
    for (const required of requiredFiles) {
      if (!files.find(f => f.path === required)) {
        errors.push(`Missing required file: ${required}`);
      }
    }
    
    // Validate package.json structure
    const packageJsonFile = files.find(f => f.path === 'package.json');
    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        if (!packageJson.name) errors.push('package.json missing name');
        if (!packageJson.scripts) errors.push('package.json missing scripts');
      } catch {
        errors.push('package.json is not valid JSON');
      }
    }
    
    // Validate TypeScript files have basic syntax
    const tsFiles = files.filter(f => f.path.endsWith('.ts'));
    for (const tsFile of tsFiles) {
      if (!tsFile.content.includes('export')) {
        errors.push(`TypeScript file ${tsFile.path} appears to have no exports`);
      }
    }
    
    return errors;
  }

  // Helper method to preview what would be generated without creating files
  previewGeneration(result: GenerationResult): void {
    console.log('\n📋 Generation Preview:');
    console.log('='.repeat(50));
    console.log(`Package: ${result.simulationName}`);
    console.log(`Output Directory: ${result.outputDir}`);
    console.log(`System Type: ${result.analysis.systemType}`);
    console.log(`Complexity: ${result.analysis.complexity}`);
    console.log('\nFiles to be generated:');
    
    for (const file of result.files) {
      console.log(`  📄 ${file.path} (${file.type})`);
      if (file.path === 'src/index.ts') {
        console.log('     Main simulation entry point');
      } else if (file.path === 'src/types.ts') {
        console.log(`     ${result.stateDesign.states.length} states, ${result.eventDesign.eventTypes.length} event types`);
      } else if (file.path === 'src/event-generators.ts') {
        console.log(`     ${result.eventDesign.eventGenerators.length} event generators`);
      }
    }
    
    console.log('\nState Machine:');
    console.log(`  States: ${result.stateDesign.states.map(s => s.name).join(', ')}`);
    console.log(`  Initial: ${result.stateDesign.initialState}`);
    console.log(`  Transitions: ${result.stateDesign.transitions.length}`);
    
    console.log('\nEvent System:');
    console.log(`  Event Types: ${result.eventDesign.eventTypes.map(e => e.name).join(', ')}`);
    console.log(`  Generators: ${result.eventDesign.eventGenerators.length}`);
    
    console.log('='.repeat(50));
  }
}