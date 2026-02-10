// core/history/HistoryManager.js
export default class HistoryManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this._listeners = new Set();
  }

  /**
   * Subscribe to history changes.
   * Returns an unsubscribe function.
   */
  onChange(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _emit(event) {
    this._listeners.forEach((listener) => listener(event));
  }

  /**
   * Push a new rotation move
   */
  push(move) {
    this.undoStack.push(move);
    this.redoStack.length = 0; // clear redo
    this._emit({ type: 'push', move });
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return null;

    const move = this.undoStack.pop();
    this.redoStack.push(move);

    const result = {
      ...move,
      direction: -move.direction,
    };
    this._emit({ type: 'undo', move: result });
    return result;
  }

  redo() {
    if (!this.canRedo()) return null;

    const move = this.redoStack.pop();
    this.undoStack.push(move);

    this._emit({ type: 'redo', move });
    return move;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this._emit({ type: 'clear' });
  }
}
