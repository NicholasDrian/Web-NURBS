import { vec3, vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Curve } from "../geometry/nurbs/curve";

export const addTestSceneCurve = function() {


  const curve1: Curve = new Curve(
    null, [
    vec4.create(-30, -30, 10, 1),
    vec4.create(-30, 30, 10, 1),
    vec4.create(30, 30, 10, 1),
    vec4.create(30, -30, 10, 1)
  ],
    2
  );

  INSTANCE.getScene().addGeometry(curve1);


}
