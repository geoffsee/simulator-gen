# Simulators Framework Core Library

The core simulation framework that provides generic, reusable components for building event-driven simulations. This package contains the foundational classes and utilities that power all domain-specific simulators.

## Overview

The `@sim-generator/lib` package provides a comprehensive framework for building state-machine-based simulations with event processing, timing controls, and extensible architecture. It's designed to be domain-agnostic while providing all the necessary building blocks for complex simulation scenarios.

## Features

### Core Components

- **State Machine**: Generic state machine with configurable states and transitions
- **Event System**: Flexible event handling with queues, generators, and processors
- **Simulation Engine**: Time-based simulation with configurable intervals and lifecycle management
- **Utilities**: Common helper functions for IDs, timestamps, randomization, and more

### Key Capabilities

- **Type Safety**: Full TypeScript support with generic types for domain customization
- **Event-Driven Architecture**: Comprehensive event system with custom handlers
- **Flexible Timing**: Configurable simulation intervals with pause/resume functionality
- **Extensible Design**: Abstract base classes that can be extended for specific domains
- **Statistics Tracking**: Built-in metrics collection and monitoring
- **Error Handling**: Robust validation and error management

## Installation

```bash
bun install @sim-generator/lib
```

## Quick Start

### Using the Factory Function

```typescript
import { createSimulation } from '@sim-generator/lib';

// Define your domain types
enum GameState {
  Menu = 'Menu',
  Playing = 'Playing', 
  GameOver = 'GameOver'
}

interface GameEvent {
  type: 'start' | 'score' | 'end';
  payload?: any;
}

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
  }
});

// Start simulation
simulation.start({
  minInterval: 1000,
  maxInterval: 3000
});
```

### Manual Setup

```typescript
import { 
  BaseStateMachine, 
  SimulationEngine,
  Event,
  EventGenerator 
} from '@sim-generator/lib';

// Create custom state machine
class GameStateMachine extends BaseStateMachine<GameState, GameEvent> {
  protected handleEvent(event: GameEvent): void {
    // Custom event handling logic
    switch (event.type) {
      case 'start':
        this.transition(GameState.Playing);
        break;
      case 'end':
        this.transition(GameState.GameOver);
        break;
    }
  }
}

// Create and start simulation engine
const stateMachine = new GameStateMachine({
  initialState: GameState.Menu,
  allowedTransitions: { /* ... */ }
});

const engine = new SimulationEngine(stateMachine);
engine.start();
```

## API Reference

### Core Classes

#### BaseStateMachine<TState, TEvent>
Generic state machine implementation with:
- State transition management
- Event processing
- State history tracking  
- Validation and error handling

#### SimulationEngine<TState, TEvent>
Simulation orchestration engine with:
- Time-based event generation
- Pause/resume/stop controls
- Statistics collection
- Lifecycle callbacks

#### Event System
- `Event<TType, TPayload>`: Base event interface
- `EventGenerator`: Functions for creating events
- `EventHandler`: Event processing callbacks

### Utilities

#### Time Functions
- `createTimestamp()`: Generate ISO timestamps
- `randomDelay(min, max)`: Random time delays

#### ID Generation
- `generateId()`: Unique identifier creation
- `generateEventId()`: Event-specific IDs

#### Math Utilities
- `randomInt(min, max)`: Random integers
- `randomChoice(array)`: Random array selection

## Architecture

The framework follows a layered architecture:

```
┌─────────────────────────────────────┐
│          Domain Specific            │
│      (legal-sim, game-sim, etc.)    │
├─────────────────────────────────────┤
│        Simulation Engine            │
│     (timing, lifecycle, stats)      │
├─────────────────────────────────────┤
│         Event System               │
│    (generators, handlers, queue)    │
├─────────────────────────────────────┤
│        State Machine               │
│   (states, transitions, history)    │
├─────────────────────────────────────┤
│          Utilities                 │
│    (time, random, IDs, helpers)     │
└─────────────────────────────────────┘
```

## Extension Points

### Custom State Machines
Extend `BaseStateMachine` to add domain-specific logic:

```typescript
class CustomStateMachine extends BaseStateMachine<MyState, MyEvent> {
  protected handleEvent(event: MyEvent): void {
    // Custom event processing
  }
  
  protected onStateChange(from: MyState, to: MyState): void {
    // Custom state transition logic
  }
}
```

### Event Generators
Create custom event generators:

```typescript
const myEventGenerator: EventGenerator = () => ({
  id: generateEventId(),
  type: 'custom',
  timestamp: createTimestamp(),
  payload: { /* custom data */ }
});
```

## Testing

The framework includes testing utilities and supports:
- Unit testing of state machines
- Event processing validation  
- Simulation scenario testing
- Performance benchmarking

## Dependencies

- Minimal external dependencies
- TypeScript for type safety
- Node.js/Bun runtime support

## Version

Current version: 1.0.0

## Contributing

This package is part of the simulators monorepo. See the main README for contribution guidelines.