import * as THREE from 'three';

export default class Cube {
  constructor({
    size = 1,
    position = { x: 0, y: 0, z: 0 },
    materials,
  } = {}) {
    this.size = size;
    this.position = position;
    this.materials = materials;

    this.mesh = this._createMesh();
  }

  _createMesh() {
    const geometry = new THREE.BoxGeometry(
      this.size,
      this.size,
      this.size
    );

    const mesh = new THREE.Mesh(geometry, this.materials);

    mesh.position.set(
      this.position.x,
      this.position.y,
      this.position.z
    );

    return mesh;
  }

  get object3D() {
    return this.mesh;
  }
}
