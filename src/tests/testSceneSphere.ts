

import { vec3 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { createSphere } from "../geometry/nurbs/sphere";
import { Surface } from "../geometry/nurbs/surface";

export const addTestSceneSphere = function() {

  const sphereDefault: Surface = createSphere(vec3.create(0, 0, 15), 15);
  const sphereRed: Surface = createSphere(vec3.create(30, 0, 15), 15);
  sphereRed.setMaterial("red");
  const sphereGreen: Surface = createSphere(vec3.create(-30, 0, 15), 15);
  sphereGreen.setMaterial("green");
  const sphereBlue: Surface = createSphere(vec3.create(60, 0, 15), 15);
  sphereBlue.setMaterial("blue");
  INSTANCE.getScene().addGeometry(sphereDefault);
  INSTANCE.getScene().addGeometry(sphereRed);
  INSTANCE.getScene().addGeometry(sphereGreen);
  INSTANCE.getScene().addGeometry(sphereBlue);
}
