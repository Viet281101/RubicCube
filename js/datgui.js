import { GUI } from './libs/dat.gui.module.js';

export class GUIController {
  constructor(mainApp) {
    this.mainApp = mainApp;
    this.settings = {
      backgroundColor: '#30415c',
      size: 3,
      gap: 0.06,
      showFps: false,
    };

    // Controllers reference
    this.controllers = {
      size: null,
      gap: null,
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
        this.mainApp.requestRender();
      });

    this.controllers.size = this.gui
      .add(this.settings, 'size', 2, 10, 1)
      .name('Cube Size')
      .onChange((value) => {
        this.mainApp.rebuildCube({
          size: Math.floor(value),
          cubieSize: 1,
          gap: this.settings.gap,
        });
        this.mainApp.requestRender();
      });

    this.controllers.gap = this.gui
      .add(this.settings, 'gap', 0, 0.2, 0.01)
      .name('Gap')
      .onChange((value) => {
        this.mainApp.rebuildCube({
          size: this.settings.size,
          cubieSize: 1,
          gap: value,
        });
        this.mainApp.requestRender();
      });

    this.gui
      .add(this.settings, 'showFps')
      .name('Show FPS')
      .onChange((value) => {
        this.mainApp.setFpsLabelVisible(value);
        this.mainApp.requestRender();
      });
  }

  /**
   * Disable cube edit controls when cube has been rotated
   */
  lockCubeEdit() {
    if (this.controllers.size) {
      this.controllers.size.domElement.style.pointerEvents = 'none';
      this.controllers.size.domElement.style.opacity = '0.5';
      this.controllers.size.__li.title =
        'Cannot change size after rotating cube';
    }
    if (this.controllers.gap) {
      this.controllers.gap.domElement.style.pointerEvents = 'none';
      this.controllers.gap.domElement.style.opacity = '0.5';
      this.controllers.gap.__li.title = 'Cannot change gap after rotating cube';
    }
  }

  /**
   * Enable cube edit controls (called after rebuild)
   */
  unlockCubeEdit() {
    if (this.controllers.size) {
      this.controllers.size.domElement.style.pointerEvents = '';
      this.controllers.size.domElement.style.opacity = '1';
      this.controllers.size.__li.title = '';
    }
    if (this.controllers.gap) {
      this.controllers.gap.domElement.style.pointerEvents = '';
      this.controllers.gap.domElement.style.opacity = '1';
      this.controllers.gap.__li.title = '';
    }
  }

  checkWindowSize() {
    this.gui.domElement.style.display =
      window.innerWidth <= 800 ? 'none' : 'block';
  }
}
