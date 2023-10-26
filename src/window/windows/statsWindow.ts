import { INSTANCE } from "../../cad";
import { CADWindow } from "../window";

export class StatsWindow extends CADWindow {

  public populate(): void {
    this.element.innerHTML = INSTANCE.getStats().getInnerHTML();
  }

  public tick(): void {
    this.element.innerHTML = INSTANCE.getStats().getInnerHTML();
  }

}
