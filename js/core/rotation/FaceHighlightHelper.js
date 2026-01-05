import * as THREE from 'three';

export default class FaceHighlightHelper {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;

    const geometry = new THREE.PlaneGeometry(1.02, 1.02);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  show(intersect) {
    const { point, face, object } = intersect;

    this.mesh.visible = true;

    // Position slightly offset from face
    const normal = face.normal.clone().transformDirection(object.matrixWorld);
    this.mesh.position.copy(point).add(normal.multiplyScalar(0.01));

    // Orient plane to face normal
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.normalize());
    this.mesh.setRotationFromQuaternion(quat);
  }

  hide() {
    this.mesh.visible = false;
  }
}
