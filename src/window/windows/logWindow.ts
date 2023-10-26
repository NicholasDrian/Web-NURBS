import { INSTANCE } from "../../cad";
import { CADWindow } from "../window";

export class LogWindow extends CADWindow {

  public populate(): void {
    this.element.innerHTML = INSTANCE.getLog().getLogs();
  }

  public tick(): void {

    this.populate();
    this.element.scrollTop = this.element.scrollHeight;
  }

}
