

import { vec3 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { createSphere } from "../geometry/nurbs/sphere";
import { Surface } from "../geometry/nurbs/surface";

export const addTestSceneSphere = function() {

  const sphere: Surface = createSphere(vec3.create(0, 0, 15), 15);
  INSTANCE.getScene().addGeometry(sphere);
}
