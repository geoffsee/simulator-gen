import { SimulationTemplate } from './types.js';

export class TemplateManager {
  private templates: Map<string, SimulationTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Generic template
    this.templates.set('generic', {
      name: 'generic',
      description: 'Generic simulation template for general-purpose systems',
      defaultStates: ['Initial', 'Processing', 'Complete'],
      commonEvents: ['start', 'process', 'complete', 'error'],
      templateFiles: this.getGenericTemplateFiles(),
      dependencies: []
    });

    // Business process template
    this.templates.set('business', {
      name: 'business',
      description: 'Business process simulation with approvals and workflows',
      defaultStates: ['Submitted', 'InReview', 'Approved', 'Rejected', 'Complete'],
      commonEvents: ['submit', 'review', 'approve', 'reject', 'complete'],
      templateFiles: this.getBusinessTemplateFiles(),
      dependencies: []
    });

    // Game template
    this.templates.set('game', {
      name: 'game',
      description: 'Game simulation with players, actions, and scoring',
      defaultStates: ['Waiting', 'Playing', 'Paused', 'GameOver'],
      commonEvents: ['start', 'action', 'pause', 'resume', 'end'],
      templateFiles: this.getGameTemplateFiles(),
      dependencies: []
    });

    // IoT template
    this.templates.set('iot', {
      name: 'iot',
      description: 'IoT system simulation with devices and sensors',
      defaultStates: ['Offline', 'Online', 'Active', 'Error', 'Maintenance'],
      commonEvents: ['connect', 'disconnect', 'sensor_data', 'alarm', 'maintenance'],
      templateFiles: this.getIoTTemplateFiles(),
      dependencies: []
    });

    // Legal template (based on existing legal-sim)
    this.templates.set('legal', {
      name: 'legal',
      description: 'Legal process simulation with document review and deadlines',
      defaultStates: ['Initial', 'ConflictsCheck', 'FileIntake', 'IssueSpotting', 'Research', 'Analysis', 'Strategy', 'Drafting', 'ClientComms', 'Waiting', 'Review', 'Complete'],
      commonEvents: ['email_received', 'doc_uploaded', 'hearing_set', 'opposition_motion', 'client_call', 'court_notice', 'payment_issue', 'conflict_flag', 'calendar_update'],
      templateFiles: this.getLegalTemplateFiles(),
      dependencies: []
    });
  }

  async getTemplate(name: string): Promise<SimulationTemplate> {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template '${name}' not found. Available templates: ${Array.from(this.templates.keys()).join(', ')}`);
    }
    return template;
  }

  async listTemplates(): Promise<SimulationTemplate[]> {
    return Array.from(this.templates.values());
  }

  private getGenericTemplateFiles(): Record<string, string> {
    return {
      'package.json': JSON.stringify({
        name: '{{simulationName}}',
        version: '1.0.0',
        description: '{{description}}',
        main: 'dist/index.js',
        module: 'src/index.ts',
        type: 'module',
        scripts: {
          'build': 'tsc',
          'dev': 'tsx src/index.ts',
          'start': 'node dist/index.js',
          'test': 'bun test'
        },
        dependencies: {
          '../../lib': 'workspace:*'
        },
        devDependencies: {
          '@types/bun': 'latest',
          'tsx': '^4.0.0',
          'typescript': '^5.0.0'
        }
      }, null, 2),

      'src/index.ts': `/**
 * {{simulationName}} - Generated Simulation
 * {{description}}
 */

import { createSimulation, Event } from '../../lib/src/lib.js';
import { {{simulationName}}State, {{simulationName}}Event, {{simulationName}}EventType } from './types.js';
import { EVENT_GENERATORS } from './event-generators.js';

// Create the simulation
const simulation = createSimulation<{{simulationName}}State, {{simulationName}}Event>({
  initialState: '{{initialState}}',
  allowedTransitions: {
    {{#transitions}}
    '{{from}}': [{{#to}}'{{.}}'{{#unless @last}}, {{/unless}}{{/to}}],
    {{/transitions}}
  },
  handleEvent: (event: {{simulationName}}Event) => {
    console.log(\`Processing event: \${event.type}\`, event);
    // Event handling logic will be generated here
  },
  eventGenerators: EVENT_GENERATORS
});

// Export for use
export { simulation };
export * from './types.js';
export * from './event-generators.js';

// Start simulation if running directly
if (import.meta.main) {
  console.log('Starting {{simulationName}} simulation...');
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
}`,

      'src/types.ts': `/**
 * Type definitions for {{simulationName}}
 */

import { Event } from '../../lib/src/lib.js';

// State type
export type {{simulationName}}State = {{#states}}'{{name}}'{{#unless @last}} | {{/unless}}{{/states}};

// Event types
export enum {{simulationName}}EventType {
  {{#eventTypes}}
  {{name}} = '{{value}}',
  {{/eventTypes}}
}

// Event interface
export interface {{simulationName}}Event extends Event<{{simulationName}}EventType> {
  // Additional event properties can be added here
}`,

      'src/event-generators.ts': `/**
 * Event generators for {{simulationName}}
 */

import { EventGenerator } from '../../lib/src/lib.js';
import { {{simulationName}}Event, {{simulationName}}EventType } from './types.js';

export const EVENT_GENERATORS: EventGenerator<{{simulationName}}Event>[] = [
  {{#eventGenerators}}
  // {{name}} generator
  () => ({
    id: 'evt-' + Math.random().toString(36).substr(2, 9),
    type: {{simulationName}}EventType.{{type}},
    timestamp: new Date().toISOString(),
    payload: {
      {{#payload}}
      {{name}}: {{value}},
      {{/payload}}
    }
  }),
  {{/eventGenerators}}
];`,

      'tsconfig.json': JSON.stringify({
        extends: '../../tsconfig.json',
        compilerOptions: {
          outDir: './dist',
          rootDir: './src'
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      }, null, 2),

      'README.md': `# {{simulationName}}

{{description}}

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

## Generated Structure

This simulation was generated using the sim-generator CLI tool and includes:

- **State Machine**: Manages simulation states and transitions
- **Event System**: Generates and processes domain-specific events  
- **Type Safety**: Full TypeScript support with generated types
- **Framework Integration**: Built on the reusable simulation framework

## Customization

You can customize the simulation by:

1. Modifying event generators in \`src/event-generators.ts\`
2. Updating state transition logic in \`src/index.ts\`
3. Adding new event types in \`src/types.ts\`
4. Adjusting simulation timing and parameters

Generated at: {{timestamp}}
`
    };
  }

  private getBusinessTemplateFiles(): Record<string, string> {
    // Business template would have similar structure but with business-specific content
    return this.getGenericTemplateFiles(); // Simplified for MVP
  }

  private getGameTemplateFiles(): Record<string, string> {
    // Game template would have game-specific structures
    return this.getGenericTemplateFiles(); // Simplified for MVP
  }

  private getIoTTemplateFiles(): Record<string, string> {
    // IoT template would have device/sensor specific structures
    return this.getGenericTemplateFiles(); // Simplified for MVP
  }

  private getLegalTemplateFiles(): Record<string, string> {
    // Legal template based on existing legal-sim structure
    return this.getGenericTemplateFiles(); // Simplified for MVP
  }
}