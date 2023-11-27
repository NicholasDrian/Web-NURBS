import { Mat4, mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix"


export const cloneVec3List = function(l: Vec3[]): Vec3[] {
  const res: Vec3[] = [];
  for (let v of l) res.push(vec3.clone(v));
  return res;
}

export const cloneVec3ListList = function(l: Vec3[][]): Vec3[][] {
  const res: Vec3[][] = [];
  let i = 0;
  for (let v1 of l) {
    res.push([]);
    for (let v2 of v1) {
      res[i].push(vec3.clone(v2));
    }
    i++;
  }
  return res;
}

export const cloneVec4List = function(l: Vec4[]): Vec4[] {
  const res: Vec4[] = [];
  for (let v of l) res.push(vec4.clone(v));
  return res;
}
export const cloneVec4ListList = function(l: Vec4[][]): Vec4[][] {
  const res: Vec4[][] = [];
  let i = 0;
  for (let v1 of l) {
    res.push([]);
    for (let v2 of v1) {
      res[i].push(vec4.clone(v2));
    }
    i++;
  }
  return res;
}
export const cloneMat4List = function(l: Mat4[]): Mat4[] {
  const res: Mat4[] = [];
  for (let m of l) res.push(mat4.clone(m));
  return res;
}
