import * as THREE from 'three';
import Cube from './Cube.js';
import { RUBIK_COLORS } from '../constants/colors.js';

export default class RubikCube {
  constructor({
    size = 3,
    cubieSize = 1,
    gap = 0.05,
  } = {}) {
    this.size = size;
    this.cubieSize = cubieSize;
    this.gap = gap;

    this.group = new THREE.Group();
    this.cubies = [];

    this._createCubies();
  }

  _createCubieMaterials(x, y, z) {
    const s = this.size - 1;

    const faces = [
      x === s ? RUBIK_COLORS.R : RUBIK_COLORS.NONE, // +X
      x === 0 ? RUBIK_COLORS.L : RUBIK_COLORS.NONE, // -X
      y === s ? RUBIK_COLORS.U : RUBIK_COLORS.NONE, // +Y
      y === 0 ? RUBIK_COLORS.D : RUBIK_COLORS.NONE, // -Y
      z === s ? RUBIK_COLORS.F : RUBIK_COLORS.NONE, // +Z
      z === 0 ? RUBIK_COLORS.B : RUBIK_COLORS.NONE, // -Z
    ];

    return faces.map(
      color =>
        new THREE.MeshStandardMaterial({
          color,
        })
    );
  }

  _createCubies() {
    const offset = (this.size - 1) / 2;
    const spacing = this.cubieSize + this.gap;

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          const position = {
            x: (x - offset) * spacing,
            y: (y - offset) * spacing,
            z: (z - offset) * spacing,
          };

          const materials = this._createCubieMaterials(x, y, z);

          const cubie = new Cube({
            size: this.cubieSize,
            position,
            materials,
          });

          cubie.index = { x, y, z };

          this.cubies.push(cubie);
          this.group.add(cubie.object3D);
        }
      }
    }
  }

  dispose() {
    this.group.children.forEach(child => {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    });

    this.group.clear();
    this.cubies = [];
  }

  rebuild({ size, cubieSize, gap }) {
    if (size !== undefined) this.size = size;
    if (cubieSize !== undefined) this.cubieSize = cubieSize;
    if (gap !== undefined) this.gap = gap;

    this.dispose();
    this._createCubies();
  }

  get object3D() {
    return this.group;
  }
}
