/**
 * State machine implementation for the simulation framework
 */

import { Event, EventQueue } from './events.js';
import { nowISO } from './utils.js';

/**
 * Interface for state machine implementations
 */
export interface StateMachine<TState, TEvent extends Event = Event> {
  currentState: TState;
  allowedTransitions: Record<string, string[]>;
  transition(newState: TState): boolean;
  canTransition(newState: TState): boolean;
  processEvent(event: TEvent): void;
}

/**
 * Configuration for creating a state machine
 */
export interface StateMachineConfig<TState> {
  initialState: TState;
  allowedTransitions: Record<string, string[]>;
  onStateChange?: (from: TState, to: TState) => void;
  onInvalidTransition?: (from: TState, to: TState) => void;
  enableLogging?: boolean;
}

/**
 * Base state machine implementation
 */
export abstract class BaseStateMachine<TState, TEvent extends Event = Event> 
  implements StateMachine<TState, TEvent> {
  
  protected _currentState: TState;
  protected _allowedTransitions: Record<string, string[]>;
  protected _onStateChange?: (from: TState, to: TState) => void;
  protected _onInvalidTransition?: (from: TState, to: TState) => void;
  protected _enableLogging: boolean;
  protected _eventQueue: EventQueue<TEvent>;
  protected _stateHistory: Array<{ state: TState; timestamp: string }> = [];

  constructor(config: StateMachineConfig<TState>) {
    this._currentState = config.initialState;
    this._allowedTransitions = config.allowedTransitions;
    this._onStateChange = config.onStateChange;
    this._onInvalidTransition = config.onInvalidTransition;
    this._enableLogging = config.enableLogging ?? false;
    this._eventQueue = new EventQueue<TEvent>();
    
    // Record initial state
    this._stateHistory.push({
      state: this._currentState,
      timestamp: nowISO()
    });

    this.setupEventHandlers();
  }

  /**
   * Gets the current state
   */
  get currentState(): TState {
    return this._currentState;
  }

  /**
   * Gets the allowed transitions configuration
   */
  get allowedTransitions(): Record<string, string[]> {
    return { ...this._allowedTransitions };
  }

  /**
   * Gets the state history
   */
  get stateHistory(): Array<{ state: TState; timestamp: string }> {
    return [...this._stateHistory];
  }

  /**
   * Gets the previous state (if any)
   */
  get previousState(): TState | undefined {
    return this._stateHistory.length > 1 
      ? this._stateHistory[this._stateHistory.length - 2].state 
      : undefined;
  }

  /**
   * Checks if a transition from current state to new state is allowed
   */
  canTransition(newState: TState): boolean {
    const currentStateKey = String(this._currentState);
    const newStateKey = String(newState);
    const allowed = this._allowedTransitions[currentStateKey] || [];
    return allowed.includes(newStateKey);
  }

  /**
   * Attempts to transition to a new state
   */
  transition(newState: TState): boolean {
    const from = this._currentState;
    
    if (!this.canTransition(newState)) {
      if (this._enableLogging) {
        console.warn(`Invalid transition from ${String(from)} to ${String(newState)}`);
      }
      this._onInvalidTransition?.(from, newState);
      return false;
    }

    // Perform the transition
    this._currentState = newState;
    this._stateHistory.push({
      state: newState,
      timestamp: nowISO()
    });

    if (this._enableLogging) {
      console.log(`State transition: ${String(from)} -> ${String(newState)}`);
    }

    // Call the state change callback
    this._onStateChange?.(from, newState);

    // Process any pending events after state change
    this.processPendingEvents();

    return true;
  }

  /**
   * Forces a transition without checking if it's allowed (use with caution)
   */
  forceTransition(newState: TState): void {
    const from = this._currentState;
    this._currentState = newState;
    this._stateHistory.push({
      state: newState,
      timestamp: nowISO()
    });

    if (this._enableLogging) {
      console.log(`Forced transition: ${String(from)} -> ${String(newState)}`);
    }

    this._onStateChange?.(from, newState);
    this.processPendingEvents();
  }

  /**
   * Adds an event to the processing queue
   */
  queueEvent(event: TEvent): void {
    this._eventQueue.enqueue(event);
  }

  /**
   * Processes an event immediately
   */
  processEvent(event: TEvent): void {
    try {
      this.handleEvent(event);
    } catch (error) {
      if (this._enableLogging) {
        console.error(`Error processing event ${String(event.type)}:`, error);
      }
    }
  }

  /**
   * Processes all pending events in the queue
   */
  processPendingEvents(): void {
    this._eventQueue.processAll();
  }

  /**
   * Resets the state machine to its initial state
   */
  reset(): void {
    const initialState = this._stateHistory[0]?.state;
    if (initialState) {
      this.forceTransition(initialState);
      // Keep only the initial state in history
      this._stateHistory = this._stateHistory.slice(0, 1);
    }
  }

  /**
   * Gets a summary of the current state machine
   */
  getSummary(): {
    currentState: TState;
    previousState: TState | undefined;
    stateCount: number;
    queueSize: number;
  } {
    return {
      currentState: this._currentState,
      previousState: this.previousState,
      stateCount: this._stateHistory.length,
      queueSize: this._eventQueue.size
    };
  }

  /**
   * Abstract method that subclasses must implement to handle events
   */
  protected abstract handleEvent(event: TEvent): void;

  /**
   * Sets up event handlers (can be overridden by subclasses)
   */
  protected setupEventHandlers(): void {
    // Default implementation - can be overridden by subclasses
    this._eventQueue.onAny((event) => this.processEvent(event));
  }

  /**
   * Validates a state (can be overridden by subclasses)
   */
  protected validateState(state: TState): boolean {
    // Default implementation - can be overridden for custom validation
    return state != null;
  }

  /**
   * Called when entering a state (can be overridden by subclasses)
   */
  protected onEnterState(state: TState): void {
    // Default implementation - can be overridden
  }

  /**
   * Called when leaving a state (can be overridden by subclasses)
   */
  protected onLeaveState(state: TState): void {
    // Default implementation - can be overridden
  }
}