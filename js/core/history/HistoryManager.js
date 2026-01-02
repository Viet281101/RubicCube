// core/history/HistoryManager.js
export default class HistoryManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Push a new rotation move
   */
  push(move) {
    this.undoStack.push(move);
    this.redoStack.length = 0; // clear redo
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

    return {
      ...move,
      direction: -move.direction,
    };
  }

  redo() {
    if (!this.canRedo()) return null;

    const move = this.redoStack.pop();
    this.undoStack.push(move);

    return move;
  }

  clear() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
