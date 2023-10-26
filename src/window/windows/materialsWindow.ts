import { CADWindow } from "../window"


export class MaterialsWindow extends CADWindow {

  public populate(): void {
    this.element.innerText = "Materials Window";
  }

  public tick(): void {

  }

}
