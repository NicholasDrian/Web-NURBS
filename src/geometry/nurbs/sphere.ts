import { vec3, Vec3 } from "wgpu-matrix";
import { Ray } from "../ray";
import { createArc } from "./arc";
import { Curve } from "./curve";
import { revolve } from "./revolve";
import { Surface } from "./surface";


export const createSphere = function(center: Vec3, radius: number): Surface {

  const arc: Curve = createArc(center, vec3.create(1, 0, 0), vec3.create(0, 1, 0), radius, 0, Math.PI);
  return revolve(new Ray(center, vec3.create(1, 0, 0)), arc, Math.PI * 2);

}
