import { vec3, vec4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Mesh } from "../geometry/mesh"
import { Curve } from "../geometry/nurbs/curve";
import { loft } from "../geometry/nurbs/loft";
import { Surface } from "../geometry/nurbs/surface";
import { ObjectID } from "../scene/scene";

export const addTestScene1 = function() {

  const mesh: ObjectID = INSTANCE.getScene().addGeometry(
    new Mesh(
      null,
      [vec3.create(-5, -5, 1), vec3.create(5, -5, 1), vec3.create(5, 5, 1), vec3.create(-5, 5, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]
    )
  );
  const curve1: ObjectID = INSTANCE.getScene().addGeometry(
    new Curve(null, [
      vec4.create(-50, -50, 0, 1),
      vec4.create(-50, 50, 0, 1),
      vec4.create(50, 50, 0, 1),
      vec4.create(50, -50, 0, 1)
    ],
      2
    )
  );
  const curve2: ObjectID = INSTANCE.getScene().addGeometry(
    new Curve(null, [
      vec4.create(-40, -40, 10, 1),
      vec4.create(-40, 40, 10, 1),
      vec4.create(40, 40, 10, 1),
      vec4.create(40, -40, 10, 1)
    ],
      2
    )
  );
  const curve3: ObjectID = INSTANCE.getScene().addGeometry(
    new Curve(null, [
      vec4.create(-50, -50, 30, 1),
      vec4.create(-50, 50, 30, 1),
      vec4.create(50, 50, 30, 1),
      vec4.create(50, -50, 30, 1),
      //vec4.create(150, -50, 30, 1),
      //  vec4.create(150, 50, 30, 1),
      // vec4.create(250, 50, 30, 1),
      // vec4.create(250, -50, 30, 1),
      // vec4.create(350, -50, 30, 1),
      // vec4.create(350, 50, 30, 1),
    ],
      3
    )
  );
  // (<Curve>INSTANCE.getScene().getGeometry(curve3)).elevateDegree(1);

  const surface: ObjectID = INSTANCE.getScene().addGeometry(
    loft(
      [<Curve>INSTANCE.getScene().getGeometry(curve1),
      <Curve>INSTANCE.getScene().getGeometry(curve2),
      <Curve>INSTANCE.getScene().getGeometry(curve3)],
      2
    )
  );
  /*
  const surface: ObjectID = INSTANCE.getScene().addGeometry(
    new Surface(
      [],
      [],
      [],
      [],
      2,
      2,
    )
  );
  */
}
