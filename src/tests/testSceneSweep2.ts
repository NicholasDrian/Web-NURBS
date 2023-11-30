
import { vec3, vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Curve } from "../geometry/nurbs/curve";

export const addTestSceneSweep2 = function() {


  const p1: Curve = new Curve(
    null, [
    vec4.create(-30, -10, 10, 1),
    vec4.create(-20, -20, 10, 1),
    vec4.create(20, -20, 10, 1),
    vec4.create(30, -10, 10, 1)
  ], 2);

  const p2: Curve = new Curve(
    null, [
    vec4.create(-30, 10, 10, 1),
    vec4.create(-20, 20, 10, 1),
    vec4.create(20, 20, 10, 1),
    vec4.create(30, 10, 10, 1)
  ], 2);

  const c1: Curve = new Curve(
    null, [
    vec4.create(-30, -10, 10, 1),
    vec4.create(-30, 0, 0, 1),
    vec4.create(-30, 10, 10, 1),
  ], 2);

  const c2: Curve = new Curve(
    null, [
    vec4.create(30, -10, 10, 1),
    vec4.create(30, 0, 0, 1),
    vec4.create(30, 10, 10, 1),
  ], 2);

  INSTANCE.getScene().addGeometry(p1);
  INSTANCE.getScene().addGeometry(p2);
  INSTANCE.getScene().addGeometry(c1);
  INSTANCE.getScene().addGeometry(c2);


}
