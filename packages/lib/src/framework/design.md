# Simulation Framework Design

## Overview

This document outlines the design of a generic simulation framework extracted from the legal simulation implementation. The framework is designed to be reusable across different domains while maintaining the core functionality of state management, event processing, and time-based simulation.

## Core Components

### 1. State Machine

The foundation of the framework is a generic state machine that can be customized for different domains:

- **States**: Enumerable or string-based states
- **Transitions**: Rules for moving between states
- **State Management**: Methods for transitioning states and validating transitions

### 2. Event System

A flexible event system that handles both internally and externally generated events:

- **Event Interface**: Standard structure for all events
- **Event Queue**: Management of event processing
- **Event Handlers**: Logic for responding to different event types

### 3. Simulation Engine

The engine that drives the simulation forward in time:

- **Timing Mechanism**: Controls the pace of the simulation
- **Event Generation**: Creates events based on domain-specific logic
- **Lifecycle Management**: Start, stop, pause functionality

### 4. Utilities

Common utilities needed across simulations:

- **Time Functions**: Timestamp generation, time manipulation
- **Random Generators**: Functions for creating random values within constraints
- **ID Generation**: Utilities for creating unique identifiers

## Interfaces

```typescript
// Core State Machine
interface StateMachine<TState, TEvent> {
  currentState: TState;
  allowedTransitions: Record<TState, TState[]>;
  transition(newState: TState): boolean;
  canTransition(newState: TState): boolean;
  processEvent(event: TEvent): void;
}

// Event System
interface Event<TType = string, TPayload = any> {
  id: string;
  type: TType;
  timestamp: string;
  payload?: TPayload;
}

// Simulation Engine
interface SimulationEngine<TState, TEvent> {
  stateMachine: StateMachine<TState, TEvent>;
  start(options?: SimulationOptions): void;
  stop(): void;
  pause(): void;
  resume(): void;
  injectEvent(event: TEvent): void;
  tick(): void;
}

interface SimulationOptions {
  minInterval?: number;
  maxInterval?: number;
  eventGenerators?: Array<() => Event<any, any>>;
}
```

## Implementation Strategy

1. Create abstract base classes that implement the core interfaces
2. Provide default implementations that can be extended or overridden
3. Use generics to allow type customization for different domains
4. Keep the framework lightweight with minimal dependencies
5. Provide clear documentation and examples

## Usage Example

```typescript
// Define domain-specific states and events
enum GameState {
  Start,
  Playing,
  Paused,
  GameOver
}

type GameEvent = {
  type: 'scorePoint' | 'loseLife' | 'powerUp' | 'timeExpired';
  payload?: any;
}

// Create a domain-specific state machine
class GameStateMachine extends BaseStateMachine<GameState, GameEvent> {
  constructor() {
    super({
      initialState: GameState.Start,
      allowedTransitions: {
        [GameState.Start]: [GameState.Playing],
        [GameState.Playing]: [GameState.Paused, GameState.GameOver],
        [GameState.Paused]: [GameState.Playing, GameState.GameOver],
        [GameState.GameOver]: [GameState.Start]
      }
    });
  }
  
  // Override to add custom event processing
  processEvent(event: GameEvent): void {
    // Custom logic for game events
    super.processEvent(event);
  }
}

// Create the simulation engine
const gameSimulation = new SimulationEngine({
  stateMachine: new GameStateMachine(),
  eventGenerators: [
    // Custom event generators
  ]
});

// Start the simulation
gameSimulation.start({ minInterval: 1000, maxInterval: 3000 });
```

## Comparison with Existing Implementation

The legal simulation currently uses:

1. **mobx-state-tree** for state management
2. **Custom event types** specific to legal domain
3. **setTimeout-based simulation** for event generation
4. **Domain-specific models** for legal concepts (evidence, deadlines, etc.)

Our framework will:

1. Offer a more lightweight state management alternative (while supporting MST as an option)
2. Provide a generic event system that can be extended for any domain
3. Maintain the simulation capabilities with more configuration options
4. Separate domain-specific models from the core simulation framework