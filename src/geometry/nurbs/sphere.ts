import { Mat4, mat4, Vec3, Vec4 } from "wgpu-matrix";
import { Surface } from "./surface";

const UNIT_SPHERE_CONTROLS: Vec4[][] = [

];

const UNIT_SPHERE_U_KNOTS: number[] = [

];

const UNIT_SPHERE_V_KNOTS: number[] = [

];

const UNIT_SPHERE_U_DEGREE: number = 2;
const UNIT_SPHERE_V_DEGREE: number = 2;


export const createSphere = function(center: Vec3, radius: number): Surface {

  const model: Mat4 = mat4.translate(mat4.uniformScale(mat4.identity(), radius), center);

  return new Surface(
    UNIT_SPHERE_CONTROLS,
    UNIT_SPHERE_U_KNOTS,
    UNIT_SPHERE_V_KNOTS,
    UNIT_SPHERE_U_DEGREE,
    UNIT_SPHERE_V_DEGREE,
    null, model);

}
