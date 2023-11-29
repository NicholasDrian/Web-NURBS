import { INSTANCE } from "../../cad"
import { Geometry } from "../../geometry/geometry"

export const hide = function(): void {
  const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
  for (const geo of selection) geo.hide();
}

export const show = function(): void {
  const geometry = INSTANCE.getScene().getRootGeometry();
  for (const geo of geometry) geo.show();
}

export const hideSwap = function(): void {
  const geometry = INSTANCE.getScene().getRootGeometry();
  for (const geo of geometry) {
    if (geo.isHidden()) {
      geo.show();
    } else {
      geo.hide();
    }
  }
}
