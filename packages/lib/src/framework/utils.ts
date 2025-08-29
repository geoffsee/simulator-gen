/**
 * Core utilities for the simulation framework
 */

// Counter for generating unique IDs
let _idCounter = 0;

/**
 * Generates a unique ID with an optional prefix
 */
export function nextId(prefix = "id"): string {
  return `${prefix}_${++_idCounter}`;
}

/**
 * Returns the current timestamp as an ISO string
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Clamps a number between 0 and 1
 */
export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Picks a random element from an array
 */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a random integer between min and max (inclusive)
 */
export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random float between min and max
 */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Creates a timestamp for a date that's a certain number of days from now
 */
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
}

/**
 * Creates a timestamp for a date that's a certain number of milliseconds from now
 */
export function msFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Checks if a given ISO timestamp is in the past
 */
export function isPast(isoString: string): boolean {
  return new Date(isoString).getTime() < Date.now();
}

/**
 * Utility for weighted random selection
 */
export function weightedPick<T>(items: Array<{ item: T; weight: number }>): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.item;
    }
  }
  
  // Fallback to the last item
  return items[items.length - 1].item;
}