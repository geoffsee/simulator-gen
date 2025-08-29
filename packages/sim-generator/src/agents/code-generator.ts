import { Agent, run } from '@openai/agents';
import {
  CodeGenerationRequest,
  CodeGenerationResult,
  GeneratedFile,
  FileType
} from './types.js';

export class CodeGenerator {
  private codeGenerationAgent: Agent;

  constructor() {
    this.codeGenerationAgent = new Agent({
      name: 'CodeGenerator',
      instructions: `
        You are an expert TypeScript code generator for simulation systems.
        Generate clean, well-documented, production-ready code that follows
        best practices and integrates properly with the simulation framework.
      `
    });
  }

  async generate(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    try {
      // For MVP, use template-based code generation
      return this.generateFromTemplate(request);
    } catch (error) {
      console.warn('Code generation failed, using fallback:', error);
      return this.generateFallbackCode(request);
    }
  }

  private generateFromTemplate(request: CodeGenerationRequest): CodeGenerationResult {
    const files: GeneratedFile[] = [];
    const templateFiles = request.template.templateFiles;
    
    // Create template variables for substitution
    const templateVars = this.createTemplateVariables(request);
    
    // Generate each file from template
    for (const [filePath, template] of Object.entries(templateFiles)) {
      const content = this.processTemplate(template, templateVars);
      const fileType = this.inferFileType(filePath);
      
      files.push({
        path: filePath,
        content,
        type: fileType
      });
    }

    return { files };
  }

  private generateFallbackCode(request: CodeGenerationRequest): CodeGenerationResult {
    const simulationName = this.pascalCase(request.simulationName);
    
    const files: GeneratedFile[] = [
      // Package.json
      {
        path: 'package.json',
        content: JSON.stringify({
          name: request.simulationName,
          version: '1.0.0',
          description: `Generated simulation: ${request.simulationName}`,
          main: 'dist/index.js',
          module: 'src/index.ts',
          type: 'module',
          scripts: {
            build: 'tsc',
            dev: 'tsx src/index.ts',
            start: 'node dist/index.js'
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
        type: FileType.PACKAGE_JSON
      },
      
      // Main index.ts
      {
        path: 'src/index.ts',
        content: this.generateMainFile(request),
        type: FileType.TYPESCRIPT
      },
      
      // Types file
      {
        path: 'src/types.ts',
        content: this.generateTypesFile(request),
        type: FileType.TYPESCRIPT
      },
      
      // Event generators
      {
        path: 'src/event-generators.ts', 
        content: this.generateEventGeneratorsFile(request),
        type: FileType.TYPESCRIPT
      },
      
      // TypeScript config
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
          extends: '../../tsconfig.json',
          compilerOptions: {
            outDir: './dist',
            rootDir: './src'
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist']
        }, null, 2),
        type: FileType.CONFIG
      },
      
      // README
      {
        path: 'README.md',
        content: this.generateReadme(request),
        type: FileType.MARKDOWN
      }
    ];

    return { files };
  }

  private createTemplateVariables(request: CodeGenerationRequest): Record<string, any> {
    const simulationName = this.pascalCase(request.simulationName);
    
    return {
      simulationName,
      description: `Generated simulation: ${request.simulationName}`,
      timestamp: new Date().toISOString(),
      initialState: request.stateDesign.initialState,
      
      states: request.stateDesign.states.map(state => ({
        name: state.name,
        description: state.description,
        type: state.type
      })),
      
      transitions: request.stateDesign.transitions.map(transition => ({
        from: transition.from,
        to: transition.to.split(' | '), // Support multiple targets
        trigger: transition.trigger
      })),
      
      eventTypes: request.eventDesign.eventTypes.map(eventType => ({
        name: this.constantCase(eventType.name),
        value: eventType.name,
        description: eventType.description
      })),
      
      eventGenerators: request.eventDesign.eventGenerators.map(generator => ({
        name: generator.eventType,
        type: this.constantCase(generator.eventType),
        payload: this.generateMockPayload(generator.eventType)
      }))
    };
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    // Simple template processing - replace {{variable}} patterns
    processed = processed.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
    
    // Process arrays with {{#array}} syntax (simplified)
    processed = processed.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, arrayKey, content) => {
      const array = variables[arrayKey];
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = content;
        // Replace item properties
        Object.entries(item).forEach(([prop, value]) => {
          itemContent = itemContent.replace(new RegExp(`\\{\\{${prop}\\}\\}`, 'g'), String(value));
        });
        // Replace @last helper
        itemContent = itemContent.replace(/\{\{#unless @last\}\}(.*?)\{\{\/unless\}\}/g, (m, c) => {
          return index === array.length - 1 ? '' : c;
        });
        return itemContent;
      }).join('');
    });
    
    return processed;
  }

  private generateMainFile(request: CodeGenerationRequest): string {
    const simulationName = this.pascalCase(request.simulationName);
    const stateType = `${simulationName}State`;
    const eventType = `${simulationName}Event`;
    
    return `/**
 * ${simulationName} - Generated Simulation
 * Generated at: ${new Date().toISOString()}
 */

import { createSimulation, Event } from '../../lib/src/lib.js';
import { ${stateType}, ${eventType}, ${simulationName}EventType } from './types.js';
import { EVENT_GENERATORS } from './event-generators.js';

// Create the simulation
const simulation = createSimulation<${stateType}, ${eventType}>({
  initialState: '${request.stateDesign.initialState}',
  allowedTransitions: {
${request.stateDesign.transitions.map(t => `    '${t.from}': ['${t.to}']`).join(',\n')}
  },
  handleEvent: (event: ${eventType}) => {
    console.log(\`Processing event: \${event.type}\`, event);
    
    // Event handling logic
    switch (event.type) {
${request.eventDesign.eventTypes.map(et => 
  `      case ${simulationName}EventType.${this.constantCase(et.name)}:
        console.log('Handling ${et.name} event');
        break;`
).join('\n')}
    }
  },
  eventGenerators: EVENT_GENERATORS
});

// Export for use
export { simulation };
export * from './types.js';
export * from './event-generators.js';

// Start simulation if running directly
if (import.meta.main) {
  console.log('Starting ${simulationName} simulation...');
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
  }

  private generateTypesFile(request: CodeGenerationRequest): string {
    const simulationName = this.pascalCase(request.simulationName);
    
    return `/**
 * Type definitions for ${simulationName}
 */

import { Event } from '../../lib/src/lib.js';

// State type
export type ${simulationName}State = ${request.stateDesign.states.map(s => `'${s.name}'`).join(' | ')};

// Event types
export enum ${simulationName}EventType {
${request.eventDesign.eventTypes.map(et => `  ${this.constantCase(et.name)} = '${et.name}'`).join(',\n')}
}

// Event interface
export interface ${simulationName}Event extends Event<${simulationName}EventType> {
  // Additional event properties can be added here
}`;
  }

  private generateEventGeneratorsFile(request: CodeGenerationRequest): string {
    const simulationName = this.pascalCase(request.simulationName);
    
    return `/**
 * Event generators for ${simulationName}
 */

import { EventGenerator } from '../../lib/src/lib.js';
import { ${simulationName}Event, ${simulationName}EventType } from './types.js';

export const EVENT_GENERATORS: EventGenerator<${simulationName}Event>[] = [
${request.eventDesign.eventGenerators.map(generator => `  // ${generator.eventType} generator
  () => ({
    id: 'evt-' + Math.random().toString(36).substr(2, 9),
    type: ${simulationName}EventType.${this.constantCase(generator.eventType)},
    timestamp: new Date().toISOString(),
    payload: ${this.generateMockPayload(generator.eventType)}
  })`).join(',\n\n')}
];`;
  }

  private generateReadme(request: CodeGenerationRequest): string {
    return `# ${this.pascalCase(request.simulationName)}

Generated simulation based on: ${request.analysis.systemType}

## Description

This simulation models a ${request.analysis.systemType} system with the following characteristics:

- **System Type**: ${request.analysis.systemType}
- **Complexity**: ${request.analysis.complexity}
- **States**: ${request.stateDesign.states.map(s => s.name).join(', ')}
- **Events**: ${request.eventDesign.eventTypes.map(e => e.name).join(', ')}

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

This simulation includes:

- **State Machine**: Manages simulation states and transitions
- **Event System**: Generates and processes domain-specific events
- **Type Safety**: Full TypeScript support with generated types
- **Framework Integration**: Built on the reusable simulation framework

## Customization

You can customize the simulation by:

1. Modifying event generators in \`src/event-generators.ts\`
2. Updating state transition logic in \`src/index.ts\`
3. Adding new event types in \`src/types.ts\`

Generated at: ${new Date().toISOString()}
`;
  }

  private generateMockPayload(eventType: string): string {
    // Generate realistic mock payload based on event type
    const base = '{\n      timestamp: new Date().toISOString()';
    
    const lower = eventType.toLowerCase();
    if (lower.includes('user') || lower.includes('client')) {
      return base + ',\n      userId: "user-" + Math.random().toString(36).substr(2, 8)\n    }';
    }
    if (lower.includes('data') || lower.includes('process')) {
      return base + ',\n      data: { value: Math.random() * 100 }\n    }';
    }
    if (lower.includes('error')) {
      return base + ',\n      error: "Sample error message"\n    }';
    }
    
    return base + '\n    }';
  }

  private inferFileType(filePath: string): FileType {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return FileType.TYPESCRIPT;
      case 'json': return filePath.includes('package') ? FileType.PACKAGE_JSON : FileType.JSON;
      case 'md': return FileType.MARKDOWN;
      default: return FileType.CONFIG;
    }
  }

  private pascalCase(str: string): string {
    return str.replace(/(^\w|[-_]\w)/g, (match) => match.replace(/[-_]/, '').toUpperCase());
  }

  private constantCase(str: string): string {
    return str.replace(/[- ]/g, '_').toUpperCase();
  }
}