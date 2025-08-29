# Sim-Generator CLI Design

## Command Structure

### Primary Command
```bash
sim-generate <description> [options]
```

### Options
- `--output-dir, -o`: Output directory for generated simulation (default: current directory)
- `--name, -n`: Name for the simulation package (default: auto-generated from description)
- `--template, -t`: Base template to use (default: 'generic', options: 'generic', 'legal', 'business', 'game', 'iot')
- `--interactive, -i`: Interactive mode with follow-up questions
- `--verbose, -v`: Verbose output showing generation process
- `--dry-run`: Show what would be generated without creating files
- `--config, -c`: Path to configuration file

### Additional Commands
```bash
sim-generate init [name]           # Initialize a new simulation project
sim-generate list-templates        # List available templates
sim-generate validate <directory>  # Validate generated simulation
sim-generate enhance <directory>   # Enhance existing simulation with AI suggestions
```

## OpenAI Agents Integration

### Agent Architecture
```typescript
// Primary generator agent
const simulationGeneratorAgent = new Agent({
  name: 'SimulationGenerator',
  instructions: `
    You are an expert simulation developer who creates event-based simulations.
    You analyze text descriptions of systems and generate TypeScript simulation code
    using the provided simulation framework.
    
    Your responsibilities:
    1. Parse system descriptions to identify states, events, and transitions
    2. Design appropriate data structures and interfaces
    3. Generate realistic event generators with proper randomization
    4. Create comprehensive state management logic
    5. Include proper error handling and validation
    6. Add meaningful logging and monitoring
    
    Always follow TypeScript best practices and the simulation framework patterns.
  `,
  tools: [
    analyzeSystemDescription,
    generateStateTypes,
    generateEventTypes,
    generateStateMachine,
    generateEventGenerators,
    generatePackageStructure
  ]
});

// Specialized agents for different aspects
const stateModelingAgent = new Agent({
  name: 'StateModeler',
  instructions: 'Expert at designing state machines and transitions for complex systems'
});

const eventDesignAgent = new Agent({
  name: 'EventDesigner', 
  instructions: 'Specialist in creating realistic event generators and event handling logic'
});

const codeQualityAgent = new Agent({
  name: 'CodeQualityReviewer',
  instructions: 'Reviews generated code for best practices, performance, and maintainability'
});
```

### Agent Tools/Functions
```typescript
// System analysis tools
function analyzeSystemDescription(description: string): SystemAnalysis {
  // Parse description to extract entities, relationships, processes
}

function identifyStates(analysis: SystemAnalysis): StateDefinition[] {
  // Determine appropriate states for the system
}

function identifyEvents(analysis: SystemAnalysis): EventDefinition[] {
  // Determine events that can occur in the system
}

// Code generation tools
function generateStateTypes(states: StateDefinition[]): string {
  // Generate TypeScript enum/type definitions
}

function generateEventTypes(events: EventDefinition[]): string {
  // Generate event interfaces and types
}

function generateStateMachine(states: StateDefinition[], transitions: Transition[]): string {
  // Generate state machine class extending BaseStateMachine
}

function generateEventGenerators(events: EventDefinition[]): string {
  // Generate realistic event generator functions
}

function generatePackageStructure(config: PackageConfig): FileStructure {
  // Generate complete package structure with all files
}
```

## Code Generation Pipeline

### Phase 1: Analysis
1. **System Description Parsing**
   - Extract key entities and concepts
   - Identify processes and workflows  
   - Determine system boundaries and interactions
   - Classify system type (business process, game, IoT, etc.)

2. **Domain Modeling**
   - Map entities to data structures
   - Identify state variables and their types
   - Design state transitions and validation rules
   - Plan event types and their payloads

### Phase 2: Design
3. **Architecture Planning**
   - Choose appropriate design patterns
   - Plan package structure and dependencies
   - Design extension points for customization
   - Plan testing and monitoring strategies

4. **Code Structure Design**
   - Generate TypeScript interfaces and types
   - Design state machine class hierarchy
   - Plan event handler organization
   - Design utility and helper functions

### Phase 3: Generation
5. **Code Generation**
   - Generate package.json with dependencies
   - Create TypeScript configuration
   - Generate domain types and interfaces
   - Create state machine implementation
   - Generate event generators
   - Create factory functions and exports

6. **Enhancement & Optimization**
   - Add realistic data and scenarios
   - Include error handling and validation
   - Add logging and monitoring hooks
   - Generate documentation and examples

### Phase 4: Validation
7. **Quality Assurance**
   - Validate TypeScript compilation
   - Check framework integration
   - Verify realistic event generation
   - Test state transition logic

## Template System

### Base Templates
- **Generic**: Basic state machine with configurable states/events
- **Business Process**: Workflow-oriented with approvals, assignments, deadlines
- **Game Simulation**: Player states, actions, scoring, progression
- **IoT System**: Device states, sensor events, network communication
- **Legal Process**: Document review, deadlines, compliance (based on existing legal-sim)

### Template Structure
```typescript
interface SimulationTemplate {
  name: string;
  description: string;
  defaultStates: string[];
  commonEvents: string[];
  templateFiles: {
    [filename: string]: string; // Template content
  };
  dependencies: string[];
  agentInstructions: string; // Specialized instructions for this domain
}
```

## Generated Package Structure

```
my-simulation/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                 # Main exports
│   ├── types.ts                 # Domain-specific types
│   ├── state-machine.ts         # State machine implementation  
│   ├── events.ts                # Event definitions
│   ├── event-generators.ts      # Event generator functions
│   ├── factory.ts               # Factory functions
│   └── examples/
│       └── basic-example.ts     # Usage examples
├── tests/
│   ├── state-machine.test.ts
│   └── event-generators.test.ts
└── docs/
    └── README.md                # Generated documentation
```

## Error Handling & Recovery

### Validation Steps
1. **Input Validation**: Check description quality and completeness
2. **Generation Validation**: Verify generated code compiles
3. **Runtime Validation**: Test generated simulation actually runs
4. **Logic Validation**: Check state transitions make sense

### Recovery Strategies
1. **Interactive Clarification**: Ask user for more details if description is unclear
2. **Incremental Generation**: Generate in steps, allowing user review
3. **Fallback Templates**: Use simpler templates if complex generation fails
4. **Manual Override**: Allow user to modify generated code

## Configuration System

### CLI Configuration File (.simgenrc.json)
```json
{
  "defaultTemplate": "generic",
  "outputDir": "./simulations",
  "openaiApiKey": "env:OPENAI_API_KEY",
  "agentConfig": {
    "model": "gpt-4",
    "temperature": 0.3
  },
  "codeStyle": {
    "useSemicolons": true,
    "quotes": "single",
    "indentSize": 2
  },
  "features": {
    "includeTests": true,
    "includeDocumentation": true,
    "includeExamples": true
  }
}
```