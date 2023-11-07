import { vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { createArc } from "../geometry/nurbs/arc"
import { Curve } from "../geometry/nurbs/curve"



export const addTestSceneArc = function() {

  const arc: Curve = createArc(vec3.create(0, 0, 0), vec3.create(1, 0, 0), vec3.create(0, 1, 0), 10, 0, 4 * Math.PI / 3);
  INSTANCE.getScene().addGeometry(arc);

}
