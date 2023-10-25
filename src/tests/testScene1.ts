import { vec3 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Mesh } from "../geometry/mesh"
import { ObjectID } from "../scene/scene";

export const addTestScene1 = function() {

  const mesh: ObjectID = INSTANCE.getScene().addGeometry(
    new Mesh(
      [vec3.create(-5, -5, 1), vec3.create(5, -5, 1), vec3.create(5, 5, 1), vec3.create(-5, 5, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]
    )
  );

}
