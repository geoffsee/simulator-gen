/**
 * Simulation engine for the simulation framework
 */

import { Event, EventGenerator } from './events.js';
import { StateMachine } from './state-machine.js';
import { rand, pick } from './utils.js';

/**
 * Configuration options for the simulation engine
 */
export interface SimulationOptions {
  /** Minimum interval between events in milliseconds */
  minInterval?: number;
  /** Maximum interval between events in milliseconds */
  maxInterval?: number;
  /** Array of event generator functions */
  eventGenerators?: EventGenerator[];
  /** Enable debug logging */
  enableLogging?: boolean;
  /** Maximum number of events to process before stopping (0 = unlimited) */
  maxEvents?: number;
  /** Callback called when simulation starts */
  onStart?: () => void;
  /** Callback called when simulation stops */
  onStop?: () => void;
  /** Callback called when simulation pauses */
  onPause?: () => void;
  /** Callback called when simulation resumes */
  onResume?: () => void;
  /** Callback called after each event is processed */
  onEventProcessed?: (event: Event) => void;
  /** Callback called on each tick (time advancement) */
  onTick?: () => void;
}

/**
 * Status of the simulation engine
 */
export enum SimulationStatus {
  Stopped = 'stopped',
  Running = 'running',
  Paused = 'paused'
}

/**
 * Interface for simulation engine implementations
 */
export interface ISimulationEngine<TState, TEvent extends Event = Event> {
  stateMachine: StateMachine<TState, TEvent>;
  status: SimulationStatus;
  start(options?: SimulationOptions): void;
  stop(): void;
  pause(): void;
  resume(): void;
  injectEvent(event: TEvent): void;
  tick(): void;
}

/**
 * Main simulation engine implementation
 */
export class SimulationEngine<TState, TEvent extends Event = Event> 
  implements ISimulationEngine<TState, TEvent> {
  
  private _stateMachine: StateMachine<TState, TEvent>;
  private _status: SimulationStatus = SimulationStatus.Stopped;
  private _options: SimulationOptions = {};
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _eventCount = 0;
  private _startTime: Date | null = null;
  private _pausedTime: Date | null = null;
  private _totalPausedDuration = 0;

  constructor(stateMachine: StateMachine<TState, TEvent>) {
    this._stateMachine = stateMachine;
  }

  /**
   * Gets the state machine
   */
  get stateMachine(): StateMachine<TState, TEvent> {
    return this._stateMachine;
  }

  /**
   * Gets the current simulation status
   */
  get status(): SimulationStatus {
    return this._status;
  }

  /**
   * Gets simulation statistics
   */
  get stats(): {
    status: SimulationStatus;
    eventCount: number;
    runtime: number; // in milliseconds
    currentState: TState;
  } {
    const now = new Date();
    let runtime = 0;
    
    if (this._startTime) {
      runtime = now.getTime() - this._startTime.getTime() - this._totalPausedDuration;
      if (this._status === SimulationStatus.Paused && this._pausedTime) {
        runtime -= (now.getTime() - this._pausedTime.getTime());
      }
    }

    return {
      status: this._status,
      eventCount: this._eventCount,
      runtime: Math.max(0, runtime),
      currentState: this._stateMachine.currentState
    };
  }

  /**
   * Starts the simulation
   */
  start(options: SimulationOptions = {}): void {
    if (this._status === SimulationStatus.Running) {
      if (options.enableLogging) {
        console.warn('Simulation is already running');
      }
      return;
    }

    this._options = { 
      minInterval: 1500,
      maxInterval: 4500,
      enableLogging: false,
      maxEvents: 0,
      eventGenerators: [],
      ...options 
    };

    this._status = SimulationStatus.Running;
    this._eventCount = 0;
    this._startTime = new Date();
    this._totalPausedDuration = 0;
    this._pausedTime = null;

    if (this._options.enableLogging) {
      console.log('Simulation started');
    }

    this._options.onStart?.();
    this._scheduleNextEvent();
  }

  /**
   * Stops the simulation
   */
  stop(): void {
    if (this._status === SimulationStatus.Stopped) {
      return;
    }

    this._clearTimer();
    this._status = SimulationStatus.Stopped;

    if (this._options.enableLogging) {
      console.log('Simulation stopped');
      console.log(`Final stats:`, this.stats);
    }

    this._options.onStop?.();
  }

  /**
   * Pauses the simulation
   */
  pause(): void {
    if (this._status !== SimulationStatus.Running) {
      return;
    }

    this._clearTimer();
    this._status = SimulationStatus.Paused;
    this._pausedTime = new Date();

    if (this._options.enableLogging) {
      console.log('Simulation paused');
    }

    this._options.onPause?.();
  }

  /**
   * Resumes the simulation
   */
  resume(): void {
    if (this._status !== SimulationStatus.Paused) {
      return;
    }

    if (this._pausedTime) {
      this._totalPausedDuration += new Date().getTime() - this._pausedTime.getTime();
      this._pausedTime = null;
    }

    this._status = SimulationStatus.Running;

    if (this._options.enableLogging) {
      console.log('Simulation resumed');
    }

    this._options.onResume?.();
    this._scheduleNextEvent();
  }

  /**
   * Injects an event directly into the simulation
   */
  injectEvent(event: TEvent): void {
    this._processEvent(event);
  }

  /**
   * Advances the simulation by one tick
   */
  tick(): void {
    if (this._status === SimulationStatus.Running) {
      this._options.onTick?.();
      
      // Generate and process an event if generators are available
      if (this._options.eventGenerators && this._options.eventGenerators.length > 0) {
        const generator = pick(this._options.eventGenerators);
        const event = generator() as TEvent;
        this._processEvent(event);
      }
    }
  }

  /**
   * Resets the simulation to its initial state
   */
  reset(): void {
    this.stop();
    this._stateMachine.reset();
    this._eventCount = 0;
    
    if (this._options.enableLogging) {
      console.log('Simulation reset');
    }
  }

  /**
   * Schedules the next event to be generated
   */
  private _scheduleNextEvent(): void {
    if (this._status !== SimulationStatus.Running) {
      return;
    }

    // Check if we've reached the maximum event count
    if (this._options.maxEvents && this._options.maxEvents > 0 && 
        this._eventCount >= this._options.maxEvents) {
      this.stop();
      return;
    }

    const minMs = this._options.minInterval ?? 1500;
    const maxMs = this._options.maxInterval ?? 4500;
    const nextInterval = rand(minMs, maxMs);

    this._timer = setTimeout(() => {
      if (this._status === SimulationStatus.Running) {
        this.tick();
        this._scheduleNextEvent();
      }
    }, nextInterval);
  }

  /**
   * Processes an event through the state machine
   */
  private _processEvent(event: TEvent): void {
    try {
      this._stateMachine.processEvent(event);
      this._eventCount++;

      if (this._options.enableLogging) {
        const stats = this.stats;
        console.log(`[${new Date().toLocaleTimeString()}] Event: ${String(event.type)}, ` +
                   `State: ${String(stats.currentState)}, Count: ${stats.eventCount}`);
      }

      this._options.onEventProcessed?.(event);
    } catch (error) {
      if (this._options.enableLogging) {
        console.error('Error processing event:', error);
      }
    }
  }

  /**
   * Clears the current timer
   */
  private _clearTimer(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}

/**
 * Factory for creating simulation engines with common configurations
 */
export class SimulationEngineFactory {
  /**
   * Creates a basic simulation engine with default settings
   */
  static createBasic<TState, TEvent extends Event = Event>(
    stateMachine: StateMachine<TState, TEvent>
  ): SimulationEngine<TState, TEvent> {
    return new SimulationEngine(stateMachine);
  }

  /**
   * Creates a fast simulation engine with shorter intervals
   */
  static createFast<TState, TEvent extends Event = Event>(
    stateMachine: StateMachine<TState, TEvent>,
    eventGenerators: EventGenerator[] = []
  ): SimulationEngine<TState, TEvent> {
    const engine = new SimulationEngine(stateMachine);
    return engine;
  }

  /**
   * Creates a debug simulation engine with logging enabled
   */
  static createDebug<TState, TEvent extends Event = Event>(
    stateMachine: StateMachine<TState, TEvent>,
    eventGenerators: EventGenerator[] = []
  ): SimulationEngine<TState, TEvent> {
    const engine = new SimulationEngine(stateMachine);
    return engine;
  }
}

/**
 * Utility function to create a realtime feed similar to the original legal sim
 */
export function startRealtimeFeed<TState, TEvent extends Event = Event>(
  stateMachine: StateMachine<TState, TEvent>,
  options: SimulationOptions = {}
): () => void {
  const engine = new SimulationEngine(stateMachine);
  engine.start(options);
  
  return () => engine.stop();
}