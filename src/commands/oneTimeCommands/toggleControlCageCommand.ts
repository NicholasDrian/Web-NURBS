import { INSTANCE } from "../../cad"
import { Geometry } from "../../geometry/geometry";


export const ControlCageOnCommand = function(): void {
  const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
  for (const geo of selection) geo.showControls(true);
}

export const ControlCageOffCommand = function(): void {
  const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
  for (const geo of selection) geo.showControls(false);
}
