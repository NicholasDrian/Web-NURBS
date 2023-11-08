import { INSTANCE } from "../../cad";
import { CADWindow } from "../window";

export class SceneWindow extends CADWindow {

  public populate(): void {
    this.element.innerHTML = "<u>SCENE:</u><br>";
    const list: HTMLElement = document.createElement("ul");
    for (let geo of INSTANCE.getScene().getRootGeometry()) {
      const item: HTMLElement = document.createElement("li");
      item.innerHTML = geo.getTypeName() +
        " id:" + geo.getID().toString() +
        " selected:" + geo.isSelected().toString();
      list.appendChild(item);
    }
    this.element.appendChild(list);
  }

  public tick(): void {
    this.populate();
  }
}
