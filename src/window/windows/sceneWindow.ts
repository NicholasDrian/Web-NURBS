import { CADWindow } from "../window";

export class SceneWindow extends CADWindow {

  public populate(): void {
    this.element.innerText = "Scene Window";
  }

  public tick(): void {

  }
}
