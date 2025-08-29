/**
 * Event system for the simulation framework
 */

import { nextId, nowISO } from './utils.js';

/**
 * Generic event interface that all simulation events must implement
 */
export interface Event<TType = string, TPayload = any> {
  id: string;
  type: TType;
  timestamp: string;
  payload?: TPayload;
}

/**
 * Event handler function type
 */
export type EventHandler<TEvent extends Event = Event> = (event: TEvent) => void;

/**
 * Event generator function type - creates events for simulation
 */
export type EventGenerator<TEvent extends Event = Event> = () => TEvent;

/**
 * Base event class that implements the Event interface
 */
export class BaseEvent<TType = string, TPayload = any> implements Event<TType, TPayload> {
  public readonly id: string;
  public readonly type: TType;
  public readonly timestamp: string;
  public readonly payload?: TPayload;

  constructor(type: TType, payload?: TPayload, id?: string) {
    this.id = id ?? nextId('evt');
    this.type = type;
    this.timestamp = nowISO();
    this.payload = payload;
  }
}

/**
 * Event queue for managing event processing order
 */
export class EventQueue<TEvent extends Event = Event> {
  private queue: TEvent[] = [];
  private handlers = new Map<string, EventHandler<TEvent>[]>();
  private globalHandlers: EventHandler<TEvent>[] = [];

  /**
   * Adds an event to the queue
   */
  enqueue(event: TEvent): void {
    this.queue.push(event);
  }

  /**
   * Removes and returns the next event from the queue
   */
  dequeue(): TEvent | undefined {
    return this.queue.shift();
  }

  /**
   * Returns the number of events in the queue
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Checks if the queue is empty
   */
  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Registers a handler for a specific event type
   */
  on(eventType: string, handler: EventHandler<TEvent>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Registers a handler for all events (global handler)
   */
  onAny(handler: EventHandler<TEvent>): void {
    this.globalHandlers.push(handler);
  }

  /**
   * Removes a handler for a specific event type
   */
  off(eventType: string, handler: EventHandler<TEvent>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Removes a global handler
   */
  offAny(handler: EventHandler<TEvent>): void {
    const index = this.globalHandlers.indexOf(handler);
    if (index !== -1) {
      this.globalHandlers.splice(index, 1);
    }
  }

  /**
   * Processes an event by calling all registered handlers
   */
  process(event: TEvent): void {
    // Call type-specific handlers
    const eventType = String(event.type);
    const typeHandlers = this.handlers.get(eventType) ?? [];
    for (const handler of typeHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    }

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in global event handler:`, error);
      }
    }
  }

  /**
   * Processes all events in the queue
   */
  processAll(): void {
    while (!this.isEmpty) {
      const event = this.dequeue();
      if (event) {
        this.process(event);
      }
    }
  }

  /**
   * Clears all events from the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Clears all handlers
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }
}

/**
 * Factory for creating events
 */
export class EventFactory {
  /**
   * Creates a new event with the given type and payload
   */
  static create<TType = string, TPayload = any>(
    type: TType, 
    payload?: TPayload, 
    id?: string
  ): Event<TType, TPayload> {
    return new BaseEvent(type, payload, id);
  }

  /**
   * Creates multiple events from a list of event data
   */
  static createMany<TType = string, TPayload = any>(
    eventData: Array<{ type: TType; payload?: TPayload; id?: string }>
  ): Event<TType, TPayload>[] {
    return eventData.map(data => this.create(data.type, data.payload, data.id));
  }
}