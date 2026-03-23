import type { Live2DEventMap, Live2DEventName } from './types/events.js';

type Listener<T> = (payload: T) => void;

/**
 * Type-safe event emitter for the Live2D loader system.
 * Supports on/off/once/emit with fully typed payloads.
 */
export class EventBus {
  private listeners = new Map<string, Set<Listener<any>>>();

  on<K extends Live2DEventName>(event: K, listener: Listener<Live2DEventMap[K]>): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  off<K extends Live2DEventName>(event: K, listener: Listener<Live2DEventMap[K]>): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  once<K extends Live2DEventName>(event: K, listener: Listener<Live2DEventMap[K]>): this {
    const wrapper: Listener<Live2DEventMap[K]> = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    return this.on(event, wrapper);
  }

  emit<K extends Live2DEventName>(event: K, payload: Live2DEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[Live2DLoader] Error in event listener for "${event}":`, err);
      }
    }
  }

  removeAllListeners(event?: Live2DEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
