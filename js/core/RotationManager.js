import RaycastHelper from './rotation/RaycastHelper.js';
import DragResolver from './rotation/DragResolver.js';
import LayerManager from './rotation/LayerManager.js';
import { DRAG_AXIS } from '../constants/index.js';

/**
 * Main controller for handling cube rotations via user interaction
 */
export default class RotationManager {
  constructor({ scene, camera, domElement, rubik, history }) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.rubik = rubik;
    this.history = history;

    // Helper classes
    this.raycastHelper = new RaycastHelper(camera, rubik);
    this.layerManager = new LayerManager(scene, rubik);

    // State
    this.enabled = false;
    this.isRotating = false;

    // Active rotation info
    this.active = {
      cubie: null,
      face: null,
      axis: null,
      layer: null,
      direction: 1,
    };

    // Drag tracking
    this.drag = {
      startX: 0,
      startY: 0,
      dx: 0,
      dy: 0,
      dragging: false,
      axis: null, // DRAG_AXIS.HORIZONTAL | DRAG_AXIS.VERTICAL
    };

    // Temporary rotation group
    this.rotationGroup = null;
    this.rotation = null;

    // Bindings
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  /* =======================
   * Public API
   * ======================= */

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this._addEvents();
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this._removeEvents();
    this._resetState();
  }

  update(delta = 1 / 60) {
    if (!this.isRotating || !this.rotation) return;

    const { axis, direction, speed, target } = this.rotation;
    const step = speed * delta * direction;

    this.rotation.angle += Math.abs(step);

    if (this.rotation.angle >= target) {
      this._finishRotation();
      return;
    }

    this.rotationGroup.rotation[axis] += step;
  }

  undo() {
    if (this.isRotating) return;
    const move = this.history.undo();
    if (!move) return;
    this._applyInstantRotation(move);
  }

  redo() {
    if (this.isRotating) return;
    const move = this.history.redo();
    if (!move) return;
    this._applyInstantRotation(move);
  }

  /* =======================
   * Event handling
   * ======================= */

  _addEvents() {
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
  }

  _removeEvents() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
  }

  _onPointerDown(event) {
    if (!this.enabled || this.isRotating) return;

    const intersect = this.raycastHelper.raycast(event, this.domElement);
    if (!intersect) return;

    const { cubie, face, axis, layer } =
      this.raycastHelper.extractRotationInfo(intersect);

    this.active.cubie = cubie;
    this.active.face = face;
    this.active.axis = axis;
    this.active.layer = layer;

    this.drag.startX = event.clientX;
    this.drag.startY = event.clientY;
    this.drag.dragging = true;

    // console.log('[RotationManager]', {
    //   face,
    //   axis,
    //   layer,
    //   cubieIndex: cubie.index,
    // });
  }

  _onPointerMove(event) {
    if (!this.enabled || this.isRotating) return;
    if (!this.drag.dragging || !this.active.face) return;

    this.drag.dx = event.clientX - this.drag.startX;
    this.drag.dy = event.clientY - this.drag.startY;

    const threshold = 6;

    if (!this.drag.axis) {
      if (
        Math.abs(this.drag.dx) < threshold &&
        Math.abs(this.drag.dy) < threshold
      ) {
        return;
      }

      this.drag.axis =
        Math.abs(this.drag.dx) > Math.abs(this.drag.dy)
          ? DRAG_AXIS.HORIZONTAL
          : DRAG_AXIS.VERTICAL;

      // console.log('[Drag locked]', this.drag.axis);
    }
  }

  _onPointerUp() {
    if (!this.enabled || this.isRotating) return;
    if (!this.active.face || !this.drag.axis) {
      this._resetState();
      return;
    }

    const { rotateAxis, direction } = DragResolver.resolveRotationFromDrag({
      face: this.active.face,
      dx: this.drag.dx,
      dy: this.drag.dy,
    });

    const layer = this.raycastHelper.getLayerFromCubie(
      this.active.cubie,
      rotateAxis
    );

    this.rotationGroup = this.layerManager.createRotationGroup(
      rotateAxis,
      layer
    );

    this.rotation = {
      axis: rotateAxis,
      direction,
      layer,
      angle: 0,
      target: Math.PI / 2,
      speed: Math.PI * 2,
    };

    this.isRotating = true;
    this.drag.dragging = false;
    this.drag.axis = null;
  }

  /* =======================
   * Rotation completion
   * ======================= */

  _finishRotation() {
    const { axis, direction, layer } = this.rotation;

    this.rotationGroup.rotation[axis] =
      Math.round(this.rotationGroup.rotation[axis] / (Math.PI / 2)) *
      (Math.PI / 2);

    const rotatedCubies = this.layerManager.finishRotationGroup(
      this.rotationGroup
    );

    this.layerManager.commitCubieIndex(rotatedCubies, axis, direction);

    this.history.push({
      axis,
      layer,
      direction,
    });

    this.rotationGroup = null;
    this.rotation = null;
    this.isRotating = false;

    this._resetState();
  }

  _resetState() {
    this.active.cubie = null;
    this.active.face = null;
    this.active.axis = null;
    this.active.layer = null;
    this.active.direction = 1;

    this.drag.dragging = false;
    this.drag.axis = null;
    this.drag.dx = 0;
    this.drag.dy = 0;
  }

  _applyInstantRotation({ axis, layer, direction }) {
    const group = this.layerManager.createRotationGroup(axis, layer);

    group.rotation[axis] = (direction * Math.PI) / 2;

    group.updateMatrixWorld(true);

    const rotatedCubies = this.layerManager.finishRotationGroup(group);

    this.layerManager.commitCubieIndex(rotatedCubies, axis, direction);
  }
}
