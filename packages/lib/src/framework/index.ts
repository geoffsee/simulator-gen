/**
 * Generic Simulation Framework
 * 
 * A comprehensive framework for building domain-specific simulations with
 * state machines, event processing, and time-based simulation capabilities.
 */

// Core utilities
export * from './utils.js';

// Event system
export * from './events.js';

// State machine
export * from './state-machine.js';

// Simulation engine
export * from './simulation-engine.js';

// Framework version
export const FRAMEWORK_VERSION = '1.0.0';

/**
 * Re-export commonly used types for convenience
 */
export type {
  Event,
  EventHandler,
  EventGenerator
} from './events.js';

export type {
  StateMachine,
  StateMachineConfig
} from './state-machine.js';

export type {
  SimulationOptions,
  ISimulationEngine
} from './simulation-engine.js';

/**
 * Quick start factory function for creating a basic simulation
 */
export function createSimulation<TState, TEvent extends Event>(
  config: StateMachineConfig<TState> & {
    handleEvent: (event: TEvent) => void;
    eventGenerators?: EventGenerator[];
  }
): {
  stateMachine: StateMachine<TState, TEvent>;
  engine: ISimulationEngine<TState, TEvent>;
  start: (options?: SimulationOptions) => void;
  stop: () => void;
} {
  // Create a concrete state machine implementation
  class ConcreteStateMachine extends BaseStateMachine<TState, TEvent> {
    protected handleEvent(event: TEvent): void {
      config.handleEvent(event);
    }
  }

  const stateMachine = new ConcreteStateMachine({
    initialState: config.initialState,
    allowedTransitions: config.allowedTransitions,
    onStateChange: config.onStateChange,
    onInvalidTransition: config.onInvalidTransition,
    enableLogging: config.enableLogging
  });

  const engine = new SimulationEngine(stateMachine);

  return {
    stateMachine,
    engine,
    start: (options?: SimulationOptions) => {
      engine.start({
        eventGenerators: config.eventGenerators,
        ...options
      });
    },
    stop: () => engine.stop()
  };
}

// Import the framework classes for the factory function
import { BaseStateMachine } from './state-machine.js';
import { SimulationEngine } from './simulation-engine.js';
import { Event } from './events.js';