import { CADWindow } from "../window";

export class SnapsWindow extends CADWindow {


  public populate(): void {
    this.element.innerText = "Snaps Window";
  }

  public tick(): void {

  }

}
