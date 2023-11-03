import { vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Line } from "../geometry/line"

export const addTestScene2 = function() {


  const line: Line = new Line(null, vec3.create(0, 0, 0), vec3.create(20, 20, 0));
  INSTANCE.getScene().addGeometry(line);


}
