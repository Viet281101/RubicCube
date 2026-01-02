export const INTERACT_MODE = {
  VIEW: 'VIEW',
  ROTATE: 'ROTATE',
  SOLVE: 'SOLVE',
};

export const FACES = Object.freeze({
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
  UP: 'UP',
  DOWN: 'DOWN',
  FRONT: 'FRONT',
  BACK: 'BACK',
});

export const AXES = Object.freeze({
  X: 'x',
  Y: 'y',
  Z: 'z',
});

export const DRAG_AXIS = Object.freeze({
  HORIZONTAL: 'HORIZONTAL',
  VERTICAL: 'VERTICAL',
});

export const FACE_TO_AXIS = {
  [FACES.RIGHT]: AXES.X,
  [FACES.LEFT]: AXES.X,
  [FACES.UP]: AXES.Y,
  [FACES.DOWN]: AXES.Y,
  [FACES.FRONT]: AXES.Z,
  [FACES.BACK]: AXES.Z,
};

export const FACE_TO_SIGN = {
  [FACES.RIGHT]: +1,
  [FACES.LEFT]: -1,
  [FACES.UP]: +1,
  [FACES.DOWN]: -1,
  [FACES.FRONT]: +1,
  [FACES.BACK]: -1,
};
