import { warn } from "console";
import { walkUpBindingElementsAndPatterns } from "typescript";
import { mat4, Mat4, Vec3, vec3 } from "wgpu-matrix";
import { Plane } from "../geometry/plane";


export const swizzleYZ = function(mat: Mat4): Mat4 {
  [mat[1], mat[2]] = [mat[2], mat[1]];
  [mat[7], mat[11]] = [mat[11], mat[7]];
  [mat[14], mat[13]] = [mat[13], mat[14]];
  [mat[8], mat[4]] = [mat[4], mat[8]];
  [mat[6], mat[9]] = [mat[9], mat[6]];
  [mat[5], mat[10]] = [mat[10], mat[5]];
  return mat;
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

export const mirror = function(m: Mat4, plane: Plane): Mat4 {
  var res: Mat4 = mat4.clone(m);
  res = mat4.translate(res, vec3.scale(plane.getOrigin(), -1));

  // TODO:



  res = mat4.translate(res, plane.getOrigin());
  return res;
}
