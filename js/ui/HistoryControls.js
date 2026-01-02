export default class HistoryControls {
  constructor(app) {
    this.app = app;
    this.container = null;

    this._create();
    this._bindEvents();
  }

  _create() {
    this.container = document.createElement('div');
    this.container.className = 'history-controls';

    this.undoBtn = document.createElement('button');
    this.undoBtn.textContent = 'Undo';

    this.redoBtn = document.createElement('button');
    this.redoBtn.textContent = 'Redo';

    this.container.appendChild(this.undoBtn);
    this.container.appendChild(this.redoBtn);

    document.body.appendChild(this.container);
  }

  _bindEvents() {
    this.undoBtn.addEventListener('click', () => {
      this.app.rotationManager.undo();
    });

    this.redoBtn.addEventListener('click', () => {
      this.app.rotationManager.redo();
    });
  }
}
