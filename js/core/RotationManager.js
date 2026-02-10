import * as THREE from 'three';
import FaceHighlightHelper from './rotation/FaceHighlightHelper.js';
import CameraDragResolver from './rotation/CameraDragResolver.js';
import RaycastHelper from './rotation/RaycastHelper.js';
import LayerManager from './rotation/LayerManager.js';
import { DRAG_AXIS } from '../constants/index.js';
import { HOOKS } from '../constants/hooks.js';

/**
 * Main controller for handling cube rotations via user interaction
 */
export default class RotationManager {
  constructor({ scene, camera, domElement, rubik, history, hooks } = {}) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.rubik = rubik;
    this.history = history;
    this.locked = false;
    this.hooks = hooks || null;

    // Helper classes
    this.raycastHelper = new RaycastHelper(camera, rubik);
    this.layerManager = new LayerManager(scene, rubik);

    // State
    this.enabled = false;
    this.isRotating = false;
    this._hasEmittedFirstMove = false;

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

    // Face highlighter
    this.faceHighlighter = new FaceHighlightHelper(scene);

    // Listen to history changes to emit first move
    if (this.history && typeof this.history.onChange === 'function') {
      this._unsubscribeHistory = this.history.onChange((event) => {
        if (event.type !== 'push') return;
        if (this._hasEmittedFirstMove) return;
        this._hasEmittedFirstMove = true;
        if (this.hooks && typeof this.hooks.emit === 'function') {
          this.hooks.emit(HOOKS.FIRST_MOVE, event);
        }
      });
    }

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

  /**
   * Clean up listeners when the manager is permanently disposed
   */
  destroy() {
    if (this._unsubscribeHistory) {
      this._unsubscribeHistory();
      this._unsubscribeHistory = null;
    }
  }

  /**
   * Reset manager when cube is rebuilt
   */
  reset() {
    this.disable();
    this.history.clear();
    this._hasEmittedFirstMove = false;
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
    if (!this.enabled || this.isRotating || this.locked) return;

    const intersect = this.raycastHelper.raycast(event, this.domElement);
    if (!intersect) return;

    const { cubie, face, axis, layer } =
      this.raycastHelper.extractRotationInfo(intersect);

    const normal = intersect.face.normal.clone();
    normal.transformDirection(intersect.object.matrixWorld);

    this.active.cubie = cubie;
    this.active.face = face;
    this.active.axis = axis;
    this.active.layer = layer;
    this.active.faceNormal = normal;

    this._updateCameraVectors();

    this.drag.startX = event.clientX;
    this.drag.startY = event.clientY;
    this.drag.dragging = true;

    this.faceHighlighter.hide();
    this.locked = true;

    console.log('[RotationManager]', {
      face,
      axis,
      layer,
      cubieIndex: cubie.index,
    });
  }

  _onPointerMove(event) {
    if (!this.enabled || this.isRotating) return;

    if (!this.locked) {
      this._handleHoverHighlight(event);
    }

    if (!this.drag.dragging || !this.active.face) return;

    this._updateDragDistance(event);

    if (!this.drag.axis) {
      this._determineDragAxis();
    }
  }

  _onPointerUp() {
    if (!this.enabled || this.isRotating) return;
    if (!this.active.face || !this.drag.axis) {
      this._resetState();
      return;
    }

    this._startRotation();
  }

  /* =======================
   * Helper methods
   * ======================= */

  _updateCameraVectors() {
    this.active.cameraRight = new THREE.Vector3();
    this.active.cameraUp = new THREE.Vector3();
    this.camera.getWorldDirection(
      (this.active.cameraForward ??= new THREE.Vector3()),
    );
    this.active.cameraRight.setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.active.cameraUp.setFromMatrixColumn(this.camera.matrixWorld, 1);
  }

  _handleHoverHighlight(event) {
    if (this.drag.dragging) return;

    const intersect = this.raycastHelper.raycast(event, this.domElement);
    if (intersect) {
      this.faceHighlighter.show(intersect);
    } else {
      this.faceHighlighter.hide();
    }
  }

  _updateDragDistance(event) {
    this.drag.dx = event.clientX - this.drag.startX;
    this.drag.dy = event.clientY - this.drag.startY;
  }

  _isDragBelowThreshold(threshold = 6) {
    return (
      Math.abs(this.drag.dx) < threshold && Math.abs(this.drag.dy) < threshold
    );
  }

  _determineDragAxis() {
    if (this._isDragBelowThreshold()) return;

    this.drag.axis =
      Math.abs(this.drag.dx) > Math.abs(this.drag.dy)
        ? DRAG_AXIS.HORIZONTAL
        : DRAG_AXIS.VERTICAL;

    console.log('[Drag locked]', this.drag.axis);
  }

  _startRotation() {
    const { rotateAxis, direction } = CameraDragResolver.resolve({
      dx: this.drag.dx,
      dy: this.drag.dy,
      faceNormal: this.active.faceNormal,
      cameraRight: this.active.cameraRight,
      cameraUp: this.active.cameraUp,
    });

    const layer = this.raycastHelper.getLayerFromCubie(
      this.active.cubie,
      rotateAxis,
    );

    this.rotationGroup = this.layerManager.createRotationGroup(
      rotateAxis,
      layer,
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
      this.rotationGroup,
    );

    this.layerManager.commitCubieIndex(rotatedCubies, axis, direction);
    this.layerManager.snapCubieTransforms(rotatedCubies);

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

    this.locked = false;
    this.faceHighlighter.hide();
  }

  _applyInstantRotation({ axis, layer, direction }) {
    const group = this.layerManager.createRotationGroup(axis, layer);
    group.rotation[axis] = (direction * Math.PI) / 2;
    group.updateMatrixWorld(true);

    const rotatedCubies = this.layerManager.finishRotationGroup(group);
    this.layerManager.commitCubieIndex(rotatedCubies, axis, direction);
  }
}
