import * as THREE from 'three';
import { AXES, AXIS_TO_INDEX_KEY } from '../../constants/index.js';

/**
 * Helper class for managing rotation groups and layers
 */
export default class LayerManager {
  constructor(scene, rubik) {
    this.scene = scene;
    this.rubik = rubik;
  }

  /**
   * Check if cubie is in specific layer
   */
  _isInLayer(cubie, axis, layer) {
    const indexKey = AXIS_TO_INDEX_KEY[axis];
    return cubie.index[indexKey] === layer;
  }

  /**
   * Get all cubies in a specific layer
   */
  getCubiesInLayer(axis, layer) {
    return this.rubik.cubies.filter((c) => this._isInLayer(c, axis, layer));
  }

  /**
   * Create a rotation group for a specific layer
   */
  createRotationGroup(axis, layer) {
    const group = new THREE.Group();

    this.rubik.cubies.forEach((cubie) => {
      if (this._isInLayer(cubie, axis, layer)) {
        group.add(cubie.object3D);
      }
    });

    this.scene.add(group);
    return group;
  }

  /**
   * Finish rotation and return cubies to scene
   */
  finishRotationGroup(group) {
    const rotatedCubies = [];
    group.updateMatrixWorld(true);

    while (group.children.length) {
      const child = group.children[0];

      const cubie = this.rubik.cubies.find((c) => c.object3D === child);
      if (cubie) rotatedCubies.push(cubie);

      child.applyMatrix4(group.matrixWorld);
      this.scene.add(child);
    }

    this.scene.remove(group);
    return rotatedCubies;
  }

  _indexToPosition(index) {
    const offset = (this.rubik.size - 1) / 2;
    const spacing = this.rubik.cubieSize + this.rubik.gap;
    return {
      x: (index.leftRight - offset) * spacing,
      y: (index.downUp - offset) * spacing,
      z: (index.backFront - offset) * spacing,
    };
  }

  snapCubieTransforms(cubies) {
    const step = Math.PI / 2;
    cubies.forEach((cubie) => {
      const pos = this._indexToPosition(cubie.index);
      cubie.object3D.position.set(pos.x, pos.y, pos.z);
      cubie.object3D.rotation.x =
        Math.round(cubie.object3D.rotation.x / step) * step;
      cubie.object3D.rotation.y =
        Math.round(cubie.object3D.rotation.y / step) * step;
      cubie.object3D.rotation.z =
        Math.round(cubie.object3D.rotation.z / step) * step;
      cubie.object3D.updateMatrix();
    });
    this.scene.updateMatrixWorld(true);
  }

  /**
   * Update cubie indices after rotation
   * Works for any cube size (3x3, 4x4, 5x5, etc.)
   */
  commitCubieIndex(cubies, rotateAxis, direction) {
    const max = this.rubik.size - 1;

    const rotationLogic = {
      [AXES.X]: (idx, dir) => {
        const { downUp, backFront } = idx;
        if (dir > 0) {
          // Clockwise rotation (looking from +X)
          idx.downUp = max - backFront;
          idx.backFront = downUp;
        } else {
          // Counter-clockwise rotation
          idx.downUp = backFront;
          idx.backFront = max - downUp;
        }
      },
      [AXES.Y]: (idx, dir) => {
        const { leftRight, backFront } = idx;
        if (dir > 0) {
          // Clockwise rotation (looking from +Y)
          idx.leftRight = backFront;
          idx.backFront = max - leftRight;
        } else {
          // Counter-clockwise rotation
          idx.leftRight = max - backFront;
          idx.backFront = leftRight;
        }
      },
      [AXES.Z]: (idx, dir) => {
        const { leftRight, downUp } = idx;
        if (dir > 0) {
          // Clockwise rotation (looking from +Z)
          idx.leftRight = max - downUp;
          idx.downUp = leftRight;
        } else {
          // Counter-clockwise rotation
          idx.leftRight = downUp;
          idx.downUp = max - leftRight;
        }
      },
    };

    cubies.forEach((cubie) => {
      rotationLogic[rotateAxis]?.(cubie.index, direction);
    });
  }
}
