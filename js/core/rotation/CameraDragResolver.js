import * as THREE from 'three';
import { AXES } from '../../constants/index.js';

/**
 * Camera-based drag resolver (replaces old face-based DragResolver)
 */
export default class CameraDragResolver {
  static resolve({ dx, dy, faceNormal, cameraRight, cameraUp }) {
    const dragVec = new THREE.Vector3()
      .addScaledVector(cameraRight, dx)
      .addScaledVector(cameraUp, -dy)
      .normalize();

    const rotationAxis = new THREE.Vector3()
      .crossVectors(faceNormal, dragVec)
      .normalize();

    const abs = {
      x: Math.abs(rotationAxis.x),
      y: Math.abs(rotationAxis.y),
      z: Math.abs(rotationAxis.z),
    };

    let axis;
    if (abs.x > abs.y && abs.x > abs.z) axis = AXES.X;
    else if (abs.y > abs.x && abs.y > abs.z) axis = AXES.Y;
    else axis = AXES.Z;

    const direction = Math.sign(rotationAxis[axis]) || 1;

    return { rotateAxis: axis, direction };
  }
}
