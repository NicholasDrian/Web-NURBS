import { INSTANCE } from "../cad";
import { Geometry } from "../geometry/geometry";
import { Intersection } from "../geometry/intersection";
import { Ray } from "../geometry/ray";
import { ObjectID } from "../scene/scene";



export class Selector {

  private selection: Set<ObjectID> = new Set<ObjectID>;
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.element.id = "clicker";
    this.element.className = "floating-window";
    this.element.style.width = "auto";
    this.element.hidden = true;
    document.body.appendChild(this.element);
  }

  public reset(): void {
    for (let id of this.selection) {
      const geo: Geometry = INSTANCE.getScene().getGeometry(id);
      geo.unSelect();
    }
    this.selection.clear();
  }

  public selectAtPixel(x: number, y: number): void {
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
    const intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5);
    if (intersections.length == 0) return;
    if (intersections.length == 1) {

    }
    const list: HTMLElement = document.createElement("ul");
    this.element.innerHTML = "";
    this.element.appendChild(list);
    for (let intersection of intersections) {
      const li = document.createElement("li");
      li.innerText = intersection.description;
      li.onclick = function() {
        INSTANCE.getCommandManager().handleClickResult(intersection);
      };
      li.onmouseover = function() {
        // hover
      };
      list.appendChild(li);
    }

    this.element.setAttribute("style", `
      left:${x}px;
      top:${y}px;
      width:auto;
      height:auto;`
    );


  }

  public unSelectAtPixel(x: number, y: number): void {

  }

  public selectInRectangle(left: number, top: number, right: number, bottom: number, inclusive: boolean): void {

  }

  public unSelectInRectangle(left: number, top: number, right: number, bottom: number, inclusive: boolean): void {

  }

  public getSelection(): Set<ObjectID> {
    return this.selection;
  }

}
