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

    this.init();
    this.addEvents();
    this.animate();
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
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x30415c);
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0);
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
  }

  addEvents() {
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer.setSize(width, height, false);

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.controls.update();
    this.rotationManager.update();
    this.renderer.render(this.scene, this.camera);
  }

  rebuildCube(options) {
    this.scene.remove(this.rubik.object3D);
    this.rubik.rebuild(options);
    this.scene.add(this.rubik.object3D);
  }

  enterRotateMode() {
    if (this.mode === INTERACT_MODE.ROTATE) return;

    this.mode = INTERACT_MODE.ROTATE;
    this.controls.enabled = false;
    this.rotationManager.enable();
  }

  exitRotateMode() {
    if (this.mode === INTERACT_MODE.VIEW) return;

    this.mode = INTERACT_MODE.VIEW;
    this.controls.enabled = true;
    this.rotationManager.disable();
  }
}

const app = new MainApp();
