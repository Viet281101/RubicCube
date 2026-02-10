import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUIController } from './datgui.js';
import RubikCube from './objects/RubikCube.js';
import RotationManager from './core/RotationManager.js';
import RotateControls from './ui/RotateControls.js';
import ModeIndicator from './ui/ModeIndicator.js';
import HistoryManager from './core/history/HistoryManager.js';
import HistoryControls from './ui/HistoryControls.js';
import { INTERACT_MODE } from './constants/index.js';

class MainApp {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.rubik = null;
    this.rotationManager = null;
    this.mode = INTERACT_MODE.VIEW;
    this._loopActive = false;
    this._rafId = 0;
    this._lastTime = performance.now();
    this._pixelRatioMax = 2;
    this._pixelRatioMin = 1;
    this._pixelRatioCurrent = 1;
    this._fpsLowStart = 0;
    this._fpsHighStart = 0;
    this.fpsLabel = null;
    this._fpsLastTime = this._lastTime;
    this._fpsFrameCount = 0;

    this.init();
    this.addEvents();
    this.requestRender();

    this.guiController = new GUIController(this);
    this.rotateControls = new RotateControls(this);
    this.modeIndicator = new ModeIndicator(this);
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.initRubik();
    this.initRotationManager();
    this.initFpsLabel();
    this.resize();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null;
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.01, 100);
    this.camera.position.set(6, 6, 8);
    this.camera.lookAt(0, 0, 0);
  }

  initRenderer() {
    const isFirefox = /firefox/i.test(navigator.userAgent);
    const isLinux = /linux/i.test(navigator.userAgent);
    const maxPixelRatio = isFirefox && isLinux ? 1 : 2;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this._pixelRatioMax = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    this._pixelRatioCurrent = this._pixelRatioMax;
    this.renderer.setPixelRatio(this._pixelRatioCurrent);
    this.renderer.setClearColor(0x30415c);

    this.renderer.domElement.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        this._loopActive = false;
        if (this._rafId) {
          cancelAnimationFrame(this._rafId);
          this._rafId = 0;
        }
        if (this.fpsLabel) {
          this.fpsLabel.textContent = 'FPS: 0';
        }
      },
      false,
    );

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.requestRender();
    });
  }

  initFpsLabel() {
    this.fpsLabel = document.createElement('div');
    this.fpsLabel.className = 'fps-label';
    this.fpsLabel.textContent = 'FPS: --';
    document.body.appendChild(this.fpsLabel);
    this.setFpsLabelVisible(false);
  }

  setFpsLabelVisible(isVisible) {
    if (!this.fpsLabel) return;
    this.fpsLabel.style.display = isVisible ? '' : 'none';
    this.requestRender();
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener('start', () => this.requestRender());
    this.controls.addEventListener('change', () => this.requestRender());
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);
  }

  initRubik() {
    this.rubik = new RubikCube({
      size: 3,
      cubieSize: 1,
      gap: 0.06,
    });
    this.scene.add(this.rubik.object3D);
  }

  initRotationManager() {
    this.history = new HistoryManager();
    this.rotationManager = new RotationManager({
      scene: this.scene,
      camera: this.camera,
      domElement: this.renderer.domElement,
      rubik: this.rubik,
      history: this.history,
    });
    this.historyControls = new HistoryControls(this);

    // Listen to history changes to lock/unlock cube size
    this._setupHistoryWatcher();
  }

  _setupHistoryWatcher() {
    // Store original push method
    const originalPush = this.history.push.bind(this.history);

    // Override push to detect first rotation
    this.history.push = (move) => {
      originalPush(move);

      // Lock cube size after first rotation
      if (this.guiController) {
        this.guiController.lockCubeEdit();
      }
    };
  }

  addEvents() {
    window.addEventListener('resize', () => this.resize());
    this.renderer.domElement.addEventListener('pointerdown', () =>
      this.requestRender(),
    );
    this.renderer.domElement.addEventListener('wheel', () =>
      this.requestRender(),
    );
    this.renderer.domElement.addEventListener('pointermove', () => {
      if (this.mode === INTERACT_MODE.ROTATE) {
        this.requestRender();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._loopActive = false;
        if (this._rafId) {
          cancelAnimationFrame(this._rafId);
          this._rafId = 0;
        }
        if (this.fpsLabel) {
          this.fpsLabel.textContent = 'FPS: 0';
        }
      } else {
        this.requestRender();
      }
    });
  }

  resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.requestRender();
    }
  }

  requestRender() {
    if (this._loopActive) return;
    this._loopActive = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame((time) => this._renderLoop(time));
  }

  _renderLoop(time) {
    if (!this._loopActive) return;

    const delta = Math.min((time - this._lastTime) / 1000, 0.05);
    this._lastTime = time;

    const controlsChanged = this.controls.update();
    this.rotationManager.update(delta);
    this.renderer.render(this.scene, this.camera);

    this._fpsFrameCount += 1;
    const elapsed = time - this._fpsLastTime;
    if (elapsed >= 500) {
      const fps = Math.round((this._fpsFrameCount * 1000) / elapsed);
      if (this.fpsLabel) {
        this.fpsLabel.textContent = `FPS: ${fps}`;
      }
      this._adjustPixelRatio(fps, time);
      this._fpsFrameCount = 0;
      this._fpsLastTime = time;
    }

    if (!controlsChanged && !this.rotationManager.isRotating) {
      this._loopActive = false;
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = 0;
      }
      if (this.fpsLabel) {
        this.fpsLabel.textContent = 'FPS: 0';
      }
      this._fpsFrameCount = 0;
      this._fpsLastTime = time;
      return;
    }

    this._rafId = requestAnimationFrame((nextTime) =>
      this._renderLoop(nextTime),
    );
  }

  _adjustPixelRatio(fps, time) {
    const lowThreshold = 45;
    const highThreshold = 58;

    if (fps < lowThreshold) {
      if (!this._fpsLowStart) this._fpsLowStart = time;
      this._fpsHighStart = 0;
    } else if (fps > highThreshold) {
      if (!this._fpsHighStart) this._fpsHighStart = time;
      this._fpsLowStart = 0;
    } else {
      this._fpsLowStart = 0;
      this._fpsHighStart = 0;
      return;
    }

    if (this._fpsLowStart && time - this._fpsLowStart > 1000) {
      this._setPixelRatio(this._pixelRatioCurrent - 0.25);
      this._fpsLowStart = 0;
    }

    if (this._fpsHighStart && time - this._fpsHighStart > 2000) {
      this._setPixelRatio(this._pixelRatioCurrent + 0.25);
      this._fpsHighStart = 0;
    }
  }

  _setPixelRatio(nextRatio) {
    const clamped = Math.max(
      this._pixelRatioMin,
      Math.min(this._pixelRatioMax, nextRatio),
    );
    if (clamped === this._pixelRatioCurrent) return;
    this._pixelRatioCurrent = clamped;
    this.renderer.setPixelRatio(this._pixelRatioCurrent);
    this.requestRender();
  }

  rebuildCube(options) {
    // Exit rotate mode if active
    if (this.mode === INTERACT_MODE.ROTATE) {
      this.exitRotateMode();
    }

    // Reset rotation manager and history
    this.rotationManager.reset();

    // Rebuild cube
    this.scene.remove(this.rubik.object3D);
    this.rubik.rebuild(options);
    this.scene.add(this.rubik.object3D);

    // Unlock cube size after rebuild (fresh cube)
    if (this.guiController) {
      this.guiController.unlockCubeEdit();
    }

    console.log(`[Cube rebuilt] size: ${this.rubik.size}x${this.rubik.size}`);
    this.requestRender();
  }

  enterRotateMode() {
    if (this.mode === INTERACT_MODE.ROTATE) return;
    this.mode = INTERACT_MODE.ROTATE;
    this.controls.enabled = false;
    this.rotationManager.enable();
    if (this.modeIndicator) {
      this.modeIndicator.update();
    }
    this.requestRender();
  }

  exitRotateMode() {
    if (this.mode === INTERACT_MODE.VIEW) return;
    this.mode = INTERACT_MODE.VIEW;
    this.controls.enabled = true;
    this.rotationManager.disable();
    if (this.modeIndicator) {
      this.modeIndicator.update();
    }
    this.requestRender();
  }
}

const app = new MainApp();
