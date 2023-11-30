import { INSTANCE } from "../../cad"
import { Geometry } from "../../geometry/geometry"
import { Curve } from "../../geometry/nurbs/curve";

export const reverseCurveCommand = function() {
  const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
  for (const geo of selection) {
    if (geo.getTypeName() == "Curve") {
      (<Curve>geo).reverse();
    }
  }
}
