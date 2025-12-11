/**
 * Type-safe event emitter
 * @module utils/EventEmitter
 */

import type { EventMap, EventCallback } from '@types';

/**
 * Generic event emitter with type safety
 */
export class EventEmitter<T extends Record<string, any> = EventMap> {
  private listeners: Map<keyof T, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribe to an event
   */
  public on<K extends keyof T>(event: K, callback: EventCallback<T[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof T>(event: K, callback: EventCallback<T[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Subscribe to an event once
   */
  public once<K extends keyof T>(event: K, callback: EventCallback<T[K]>): void {
    const onceCallback: EventCallback<T[K]> = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Emit an event
   */
  public emit<K extends keyof T>(event: K, data: T[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  public removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event
   */
  public listenerCount<K extends keyof T>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Check if event has listeners
   */
  public hasListeners<K extends keyof T>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }
}
