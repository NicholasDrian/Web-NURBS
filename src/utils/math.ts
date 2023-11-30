import { mat4, Mat4, Vec3, vec3 } from "wgpu-matrix";
import { Plane } from "../geometry/plane";
import { Ray } from "../geometry/ray";


export const swizzleYZ = function(mat: Mat4): Mat4 {
  [mat[1], mat[2]] = [mat[2], mat[1]];
  [mat[7], mat[11]] = [mat[11], mat[7]];
  [mat[14], mat[13]] = [mat[13], mat[14]];
  [mat[8], mat[4]] = [mat[4], mat[8]];
  [mat[6], mat[9]] = [mat[9], mat[6]];
  [mat[5], mat[10]] = [mat[10], mat[5]];
  return mat;
}
export const swizzleYZVec3 = function(v: Vec3): Vec3 {
  [v[1], v[2]] = [v[2], v[1]];
  return v;
}
export const bin = function(a: number, b: number): number {
  let res: number = 1;
  for (let i = a; i > a - b; i--) res *= i;
  for (let i = 2; i <= b; i++) res = res / i;
  return res;
};

export const angleBetween = function(a: Vec3, b: Vec3): number {
  return Math.acos(vec3.dot(vec3.normalize(a), vec3.normalize(b)));
}

export const mirrorVector = function(v: Vec3, plane: Plane): Vec3 {
  const d: number = vec3.dot(v, plane.getNormal());
  return vec3.sub(v, vec3.scale(plane.getNormal(), 2 * d));
}

export const getMirrorTransform = function(plane: Plane): Mat4 {
  const newX: Vec3 = mirrorVector(vec3.create(1, 0, 0), plane);
  const newY: Vec3 = mirrorVector(vec3.create(0, 1, 0), plane);
  const newZ: Vec3 = mirrorVector(vec3.create(0, 0, 1), plane);
  const mirrorTransform: Mat4 = mat4.create(
    ...newX, 0,
    ...newY, 0,
    ...newZ, 0,
    0, 0, 0, 1
  );
  const toOrigin = mat4.translation(vec3.scale(plane.getOrigin(), -1));
  const toPos = mat4.translation(plane.getOrigin());
  return mat4.mul(mat4.mul(toPos, mirrorTransform), toOrigin);
}

export const scale1Vector = function(v: Vec3, factor: number, plane: Plane): Vec3 {
  const d: number = vec3.dot(v, plane.getNormal());
  return vec3.add(v, vec3.scale(plane.getNormal(), d * factor - d));
}

export const getScale1Transform = function(plane: Plane, factor: number): Mat4 {
  const newX: Vec3 = scale1Vector(vec3.create(1, 0, 0), factor, plane);
  const newY: Vec3 = scale1Vector(vec3.create(0, 1, 0), factor, plane);
  const newZ: Vec3 = scale1Vector(vec3.create(0, 0, 1), factor, plane);
  const scaleTransform: Mat4 = mat4.create(
    ...newX, 0,
    ...newY, 0,
    ...newZ, 0,
    0, 0, 0, 1
  );
  const toOrigin = mat4.translation(vec3.scale(plane.getOrigin(), -1));
  const toPos = mat4.translation(plane.getOrigin());
  return mat4.mul(mat4.mul(toPos, scaleTransform), toOrigin);
}


export const getRotationTransform = function(axis: Ray, theta: number): Mat4 {
  const rotation: Mat4 = mat4.axisRotate(mat4.identity(), axis.getDirection(), theta);
  const toOrigin: Mat4 = mat4.translation(vec3.scale(axis.getOrigin(), -1));
  const toPos: Mat4 = mat4.translation(axis.getOrigin());
  return mat4.mul(toPos, mat4.mul(rotation, toOrigin));
}

export const changeOfBasis = function(
  fromX: Vec3, fromY: Vec3, fromZ: Vec3, fromO: Vec3,
  toX: Vec3, toY: Vec3, toZ: Vec3, toO: Vec3,
): Mat4 {
  const from: Mat4 = mat4.create(
    ...fromX, 0,
    ...fromY, 0,
    ...fromZ, 0,
    ...fromO, 1
  );
  const to: Mat4 = mat4.create(
    ...toX, 0,
    ...toY, 0,
    ...toZ, 0,
    ...toO, 1
  );
  return mat4.mul(to, mat4.inverse(from));
}


export const lerp = function(a: number, b: number, r: number): number {
  return a * (1 - r) + b * r;
}






