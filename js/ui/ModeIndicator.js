export default class ModeIndicator {
  constructor(app) {
    this.app = app;
    this.element = null;

    this._create();
    this.update();
  }

  _create() {
    this.element = document.createElement('div');
    this.element.className = 'mode-indicator';
    document.body.appendChild(this.element);
  }

  update() {
    this.element.textContent = 'INTERACT MODE : ' + String(this.app.mode);
    this.element.dataset.mode = this.app.mode;
  }
}
