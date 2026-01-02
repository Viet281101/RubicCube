import { FACES, AXES } from '../../constants/index.js';

/**
 * Helper class for resolving rotation from drag gestures
 */
export default class DragResolver {
  /**
   * Resolve rotation axis and direction from drag
   */
  static resolveRotationFromDrag({ face, dx, dy }) {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const isHorizontal = absX > absY;

    let rotateAxis;
    let direction;

    switch (face) {
      case FACES.FRONT:
        rotateAxis = isHorizontal ? AXES.Y : AXES.X;
        direction = isHorizontal ? Math.sign(dx) : -Math.sign(dy);
        break;

      case FACES.BACK:
        rotateAxis = isHorizontal ? AXES.Y : AXES.X;
        direction = isHorizontal ? -Math.sign(dx) : -Math.sign(dy);
        break;

      case FACES.RIGHT:
        rotateAxis = isHorizontal ? AXES.Z : AXES.Y;
        direction = isHorizontal ? -Math.sign(dx) : -Math.sign(dy);
        break;

      case FACES.LEFT:
        rotateAxis = isHorizontal ? AXES.Z : AXES.Y;
        direction = isHorizontal ? Math.sign(dx) : -Math.sign(dy);
        break;

      case FACES.UP:
        rotateAxis = isHorizontal ? AXES.Z : AXES.X;
        direction = isHorizontal ? Math.sign(dx) : Math.sign(dy);
        break;

      case FACES.DOWN:
        rotateAxis = isHorizontal ? AXES.Z : AXES.X;
        direction = isHorizontal ? Math.sign(dx) : -Math.sign(dy);
        break;
    }

    if (direction === 0) direction = 1;

    return { rotateAxis, direction };
  }
}
