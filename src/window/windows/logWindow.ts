import { CADWindow } from "../window";

export class LogWindow extends CADWindow {

  public populate(): void {
    this.element.innerText = "Log Window";
  }

  public tick(): void {

  }

}
