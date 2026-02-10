export default class AppHooks {
  constructor() {
    this._listeners = new Map();
  }

  on(eventName, listener) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    const set = this._listeners.get(eventName);
    set.add(listener);
    return () => set.delete(listener);
  }

  off(eventName, listener) {
    const set = this._listeners.get(eventName);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      this._listeners.delete(eventName);
    }
  }

  once(eventName, listener) {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  emit(eventName, payload) {
    const set = this._listeners.get(eventName);
    if (!set) return;
    set.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.warn(`[AppHooks] Listener failed for "${eventName}"`, error);
      }
    });
  }
}
