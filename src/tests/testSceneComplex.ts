import { vec3, vec4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Mesh } from "../geometry/mesh"
import { Curve } from "../geometry/nurbs/curve";
import { loft } from "../geometry/nurbs/loft";
import { Surface } from "../geometry/nurbs/surface";

export const addTestSceneComplex = function() {

  const mesh: Mesh = new Mesh(
    null,
    [vec3.create(-5, -5, 1), vec3.create(5, -5, 1), vec3.create(5, 5, 1), vec3.create(-5, 5, 1)],
    [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
    [0, 1, 2, 2, 3, 0]
  );

  const curve1: Curve = new Curve(
    null, [
    vec4.create(-50, -50, 0, 1),
    vec4.create(-50, 50, 0, 1),
    vec4.create(50, 50, 0, 1),
    vec4.create(50, -50, 0, 1)
  ],
    2
  );
  const curve2: Curve =
    new Curve(null, [
      vec4.create(-40, -40, 10, 1),
      vec4.create(-40, 40, 10, 1),
      vec4.create(40, 40, 10, 1),
      vec4.create(40, -40, 10, 1)
    ],
      2
    );
  const curve3: Curve =
    new Curve(null, [
      vec4.create(-50, -50, 30, 1),
      vec4.create(-50, 50, 30, 1),
      vec4.create(50, 50, 30, 1),
      vec4.create(50, -50, 30, 1),
    ],
      3
    );

  const surface: Surface =
    loft(
      [curve1,
        curve2,
        curve3],
      2
    );

  INSTANCE.getScene().addGeometry(mesh);
  INSTANCE.getScene().addGeometry(curve1);
  INSTANCE.getScene().addGeometry(curve2);
  INSTANCE.getScene().addGeometry(curve3);
  INSTANCE.getScene().addGeometry(surface);

}
