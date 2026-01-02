import { GUI } from './libs/dat.gui.module.js';

export class GUIController {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.settings = {
      backgroundColor: '#30415c',
      size: 3,
      gap: 0.06,
    };
    this.init();
    this.checkWindowSize();
  }

  init() {
    this.gui = new GUI();
    const guiContainer = document.querySelector('.dg');
    if (guiContainer) {
      guiContainer.classList.add('scaled-gui');
      guiContainer.style.zIndex = '1000 !important';
      guiContainer.style.right = '-22px';
      guiContainer.style.transformOrigin = 'top right';
      guiContainer.style.transform = 'scale(1.5)';
    }

    this.gui
      .addColor(this.settings, 'backgroundColor')
      .name('Background Color')
      .onChange((value) => {
        this.mainApp.renderer.setClearColor(value);
      });

    this.gui
      .add(this.settings, 'size', 2, 10, 1)
      .name('Cube Size')
      .onChange((value) => {
        this.mainApp.rebuildCube({
          size: Math.floor(value),
          cubieSize: 1,
          gap: this.settings.gap,
        });
      });

    this.gui
      .add(this.settings, 'gap', 0, 0.2, 0.01)
      .name('Gap')
      .onChange((value) => {
        this.mainApp.rebuildCube({
          size: this.settings.size,
          cubieSize: 1,
          gap: value,
        });
      });
  }

  checkWindowSize() {
    this.gui.domElement.style.display =
      window.innerWidth <= 800 ? 'none' : 'block';
  }
}
