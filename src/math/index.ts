export { Vector3 } from './vector3';
export { Matrix4 } from "./matrix4";
export { Euler } from "./euler";
export { Quaternion } from './quaternion';
export { generateUUID } from './uuid';
export { MathUtil } from './util';

export interface DataObject<T>{
  copy: (value: T) => void;
  clone: (value: T) => T;
  equals: (value: T) => boolean;
}

export interface ArrayFlattenable<T>{
  fromArray: (array?, offset?: number) => void;
  toArray: (array?, offset?: number) => void;
}

export interface VectorDataObject<T>{
  normalize: () => T;
  length: () => number;
  lengthManhattan: () => number;
  min: (value: T) => T;
  max: (value: T) => T;
}