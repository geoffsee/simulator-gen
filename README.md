# Simulators Framework

This repository contains a generic simulation framework and domain-specific implementations. It uses the OpenAI agents SDK to generate the code assets.
The project has been restructured to extract common simulation patterns into a reusable framework that can be applied to different domains while maintaining the specific functionality of existing simulations.

## Overview

The project consists of four main packages that work together to provide a comprehensive simulation ecosystem:

- **`@sim-generator/lib`**: Core simulation framework with generic state machines, event processing, and simulation engine
- **`@sim-generator/sim-generator`**: AI-powered CLI tool for generating new simulations from natural language descriptions
- **`@simulators/api`**: A graphQL library that offers an interface for remote management of simulations

## Architecture

### Generic Simulation Framework (`packages/lib`)

The framework provides the following core components:

#### 1. **State Machine** (`state-machine.ts`)
- Generic state machine with configurable states and transitions
- State history tracking
- Event-driven state transitions
- Validation and error handling

#### 2. **Event System** (`events.ts`)
- Generic event interface and base classes
- Event queue management
- Event handlers for specific types and global events
- Event factory for creating events

#### 3. **Simulation Engine** (`simulation-engine.ts`)
- Time-based simulation with configurable intervals
- Start/stop/pause/resume controls
- Event generation and processing
- Statistics tracking and lifecycle management

#### 4. **Utilities** (`utils.ts`)
- Common helper functions for timestamps, random generation, ID creation
- Math utilities and array manipulation functions

### Usage Example

> Note: This is not a game engine. Gamification can be thought of as a medium for simulation.

```typescript
import { 
  BaseStateMachine, 
  SimulationEngine, 
  Event, 
  EventGenerator 
} from '@sim-generator/lib';

// Define domain-specific types
enum GameState {
  Menu = 'Menu',
  Playing = 'Playing',
  GameOver = 'GameOver'
}

interface GameEvent extends Event<'player_action' | 'time_expired', any> {}

// Create a domain-specific state machine
class GameStateMachine extends BaseStateMachine<GameState, GameEvent> {
  constructor() {
    super({
      initialState: GameState.Menu,
      allowedTransitions: {
        [GameState.Menu]: [GameState.Playing],
        [GameState.Playing]: [GameState.GameOver, GameState.Menu],
        [GameState.GameOver]: [GameState.Menu]
      }
    });
  }

  protected handleEvent(event: GameEvent): void {
    switch (event.type) {
      case 'player_action':
        // Handle player action
        this.transition(GameState.Playing);
        break;
      case 'time_expired':
        // Handle timeout
        this.transition(GameState.GameOver);
        break;
    }
  }
}

// Create and run the simulation
const stateMachine = new GameStateMachine();
const engine = new SimulationEngine(stateMachine);

engine.start({
  eventGenerators: [/* your event generators */],
  enableLogging: true
});
```

### Quick Start with Factory Function

For simpler use cases, the framework provides a convenient factory function:

```typescript
import { createSimulation } from '@sim-generator/lib';

// Create simulation with factory function
const simulation = createSimulation<GameState, GameEvent>({
  initialState: GameState.Menu,
  allowedTransitions: {
    [GameState.Menu]: [GameState.Playing],
    [GameState.Playing]: [GameState.GameOver],
    [GameState.GameOver]: [GameState.Menu]
  },
  handleEvent: (event) => {
    console.log(`Handling event: ${event.type}`);
    // Custom event processing logic
  },
  eventGenerators: [/* your event generators */]
});

// Start simulation
simulation.start({
  minInterval: 1000,
  maxInterval: 3000
});

// Stop when needed
simulation.stop();
```

## Simulation Generator (`packages/sim-generator`)

An AI-powered CLI tool that generates complete simulation packages from natural language descriptions:

### Features
- **AI-Powered Generation**: Uses OpenAI agents to analyze system descriptions
- **Multiple Templates**: Supports various domains (generic, legal, business, game, IoT)
- **Interactive Mode**: Follow-up questions to refine requirements
- **Complete Scaffolding**: Generates full project structure with proper configuration

### Usage
```bash
# Generate a simulation from description
bun run packages/sim-generator/index.ts "A restaurant order processing system"

# Generate with options
bun run packages/sim-generator/index.ts generate "IoT sensor network" --template iot --verbose

# Interactive mode
bun run packages/sim-generator/index.ts "Hospital workflow" --interactive
```

## Potential Domains
- **Medical Workflow Simulation**: Patient care processes, treatment protocols
- **Manufacturing Process Simulation**: Production lines, quality control
- **Financial Trading Simulation**: Market events, trading strategies
- **Project Management Simulation**: Task dependencies, resource allocation

## Future Enhancements
The framework is designed to support additional simulation domains:
- **Visualization**: Real-time simulation visualization
- **Analytics**: Advanced metrics and reporting
- **Networking**: Multi-node distributed simulations
