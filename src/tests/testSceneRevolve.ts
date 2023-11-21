
import { vec3, vec4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Line } from "../geometry/line";
import { Curve } from "../geometry/nurbs/curve";
import { revolve } from "../geometry/nurbs/revolve";
import { Surface } from "../geometry/nurbs/surface";
import { Ray } from "../geometry/ray";

export const addTestSceneRevolve = function() {

  const line: Line = new Line(null, vec3.create(0, 0, 0), vec3.create(0, 0, 100));

  const curve: Curve = new Curve(
    null, [
    vec4.create(50, 0, 0, 1),
    vec4.create(20, 0, 10, 1),
    vec4.create(50, 0, 20, 1),
    vec4.create(20, 0, 30, 1)
  ],
    2
  );

  const surface: Surface = revolve(new Ray(vec3.create(0, 0, 0), vec3.create(0, 0, 1)), curve, 0.8);
  INSTANCE.getScene().addGeometry(surface);
  INSTANCE.getScene().addGeometry(line);
  INSTANCE.getScene().addGeometry(curve);
}
