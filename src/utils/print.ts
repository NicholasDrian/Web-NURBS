import { warn } from "console";
import { mat4, mat3, Mat4, Vec3, Vec4 } from "wgpu-matrix";

export const printMat4 = function(m: Mat4): void {
  var str: string = "";
  for (var i: number = 0; i < 4; i++) {
    for (var j: number = 0; j < 4; j++) {
      str += m[4 * i + j].toFixed(2) + ",  ";
    }
    str += "\n";
  }
  console.log(str);
}

export const printVec3 = function(v: Vec3, decimals: number = 2): void {
  var str: string = "";
  for (var i: number = 0; i < 3; i++) {
    str += v[i].toFixed(decimals) + ",  ";
  }
  console.log(str);
}

export const vec4ToString = function(v: Vec4, decimals: number = 2): string {
  var str: string = "[";
  for (var i: number = 0; i < 4; i++) {
    str += v[i].toFixed(decimals) + ",";
  }
  str = str.slice(0, -1);
  return str + "]";
}
