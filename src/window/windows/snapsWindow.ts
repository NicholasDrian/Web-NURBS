import { INSTANCE } from "../../cad";
import { CADWindow } from "../window";

export class SnapsWindow extends CADWindow {


  public populate(): void {
    this.element.innerHTML = INSTANCE.getSettingsManager().getSnapSettingsManager().getHTML();
  }

  public tick(): void {
    this.populate();
  }

}
