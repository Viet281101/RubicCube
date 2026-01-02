import * as THREE from 'three';
import { AXES } from '../../constants/index.js';

/**
 * Helper class for managing rotation groups and layers
 */
export default class LayerManager {
  constructor(scene, rubik) {
    this.scene = scene;
    this.rubik = rubik;
  }

  /**
   * Get all cubies in a specific layer
   */
  getCubiesInLayer(axis, layer) {
    return this.rubik.cubies.filter((c) => {
      if (axis === AXES.X) return c.index.leftRight === layer;
      if (axis === AXES.Y) return c.index.downUp === layer;
      if (axis === AXES.Z) return c.index.backFront === layer;
      return false;
    });
  }

  /**
   * Create a rotation group for a specific layer
   */
  createRotationGroup(axis, layer) {
    const group = new THREE.Group();

    this.rubik.cubies.forEach((cubie) => {
      if (
        (axis === AXES.X && cubie.index.leftRight === layer) ||
        (axis === AXES.Y && cubie.index.downUp === layer) ||
        (axis === AXES.Z && cubie.index.backFront === layer)
      ) {
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

    while (group.children.length) {
      const child = group.children[0];

      const cubie = this.rubik.cubies.find((c) => c.object3D === child);
      if (cubie) rotatedCubies.push(cubie);

      child.applyMatrix4(group.matrix);
      this.scene.add(child);
    }

    this.scene.remove(group);
    return rotatedCubies;
  }

  /**
   * Update cubie indices after rotation
   */
  commitCubieIndex(cubies, rotateAxis, direction) {
    cubies.forEach((cubie) => {
      const idx = cubie.index;

      if (rotateAxis === AXES.X) {
        const { downUp, backFront } = idx;

        if (direction > 0) {
          idx.downUp = 2 - backFront;
          idx.backFront = downUp;
        } else {
          idx.downUp = backFront;
          idx.backFront = 2 - downUp;
        }
      }

      if (rotateAxis === AXES.Y) {
        const { leftRight, backFront } = idx;

        if (direction > 0) {
          idx.leftRight = backFront;
          idx.backFront = 2 - leftRight;
        } else {
          idx.leftRight = 2 - backFront;
          idx.backFront = leftRight;
        }
      }

      if (rotateAxis === AXES.Z) {
        const { leftRight, downUp } = idx;

        if (direction > 0) {
          idx.leftRight = 2 - downUp;
          idx.downUp = leftRight;
        } else {
          idx.leftRight = downUp;
          idx.downUp = 2 - leftRight;
        }
      }
    });
  }
}
