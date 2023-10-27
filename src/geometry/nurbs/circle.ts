import { mat4, Mat4, vec3, Vec3, Vec4, vec4 } from "wgpu-matrix";
import { printMat4, vec3ToString } from "../../utils/print";
import { Plane } from "../plane";
import { Ray } from "../ray";
import { Curve } from "./curve";

const UNIT_CIRCLE_DEGREE: number = 2;
const UNIT_CIRCLE_KNOTS: number[] = [
  0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4
];
const UNIT_CIRCLE_POINTS: Vec3[] = [
  vec3.create(1, 0, 0), vec3.create(1, 1, 0), vec3.create(0, 1, 0),
  vec3.create(-1, 1, 0), vec3.create(-1, 0, 0), vec3.create(-1, -1, 0),
  vec3.create(0, -1, 0), vec3.create(1, -1, 0), vec3.create(1, 0, 0)
];
const UNIT_CIRCLE_WEIGHTS: number[] = [
  1, Math.SQRT2 / 2, 1, Math.SQRT2 / 2,
  1, Math.SQRT2 / 2, 1, Math.SQRT2 / 2, 1
];

export const createCircleThreePoints = function(a: Vec3, b: Vec3, c: Vec3): Curve {
  console.log("creating circle from three points", a, b, c);
  const ab: Vec3 = vec3.sub(b, a);
  const ac: Vec3 = vec3.sub(c, a);
  const normal: Vec3 = vec3.normalize(vec3.cross(ab, ac));

  const ro: Vec3 = vec3.scale(vec3.add(a, b), 0.5);
  const rd: Vec3 = vec3.normalize(vec3.cross(ab, normal));
  const r: Ray = new Ray(ro, rd);

  const po: Vec3 = vec3.scale(vec3.add(a, c), 0.5);
  const pn: Vec3 = vec3.normalize(ac);
  const p: Plane = new Plane(po, pn);

  const t: number = r.intersectPlane(p, true)!;
  const center: Vec3 = r.at(t);
  const radius: number = vec3.distance(a, center);

  return createCircleCenterNormalRadius(center, normal, radius);

}

export const createCircleCenterNormalRadius = function(center: Vec3, normal: Vec3, radius: number) {
  console.log("creating circle from center normal radius", vec3ToString(center), vec3ToString(normal), radius);
  if (normal[2] < 0) normal = vec3.scale(normal, -1);
  const unitZ: Vec3 = vec3.create(0, 0, 1);
  var x: Vec3;
  var y: Vec3;
  if (vec3.distance(normal, unitZ) < 0.00001) {
    x = vec3.create(radius, 0, 0);
    y = vec3.create(0, radius, 0);
  } else {
    x = vec3.scale(vec3.normalize(vec3.cross(normal, unitZ)), radius);
    y = vec3.scale(vec3.normalize(vec3.cross(normal, x)), radius);
  }
  normal = vec3.scale(normal, radius);

  // swizzle y and z in the matrix
  // why did they choose this rediculous clipspace
  const model: Mat4 = mat4.create(
    x[0], x[2], x[1], 0,
    normal[0], normal[2], normal[1], 0,
    y[0], y[2], y[1], 0,
    center[0], center[2], center[1], 1
  );
  printMat4(model);
  return new Curve(null, UNIT_CIRCLE_POINTS, UNIT_CIRCLE_DEGREE, UNIT_CIRCLE_KNOTS, UNIT_CIRCLE_WEIGHTS, model);
}

