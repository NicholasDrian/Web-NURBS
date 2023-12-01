import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Geometry } from "../geometry/geometry";
import { Intersection } from "../geometry/intersection";
import { Ray } from "../geometry/ray";
import { cursor } from "../widgets/cursor";



export class Clicker {

  private point: Vec3 | null;
  private element: HTMLDivElement;
  private clicked: boolean;

  constructor() {
    this.point = null;
    this.clicked = false;
    this.element = document.createElement("div");
    this.element.id = "clicker";
    this.element.className = "floating-window";
    this.element.style.width = "auto";
    this.element.hidden = true;
    document.body.appendChild(this.element);
    this.onMouseMove();
    cursor.show();
  }

  public onMouseMove(types?: string[]): void {

    if (this.clicked) return; // currently selecting from dropdown

    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(mousePos[0], mousePos[1]);
    var intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5, false);

    if (types) {
      intersections = intersections.filter((intersection: Intersection) => {
        return types.includes(intersection.description);
      });
    }

    if (intersections.length !== 0) {
      this.point = intersections[0].point;
      cursor.setPosition(INSTANCE.getScene().getCamera().getPixelAtPoint(this.point));
      cursor.show();
    } else {
      cursor.hide();
    }

  }

  public click(types?: string[], sub: boolean = false): void {
    if (this.clicked) {
      this.reset();
      return;
    }
    this.clicked = true;
    this.element.hidden = false;
    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(mousePos[0], mousePos[1]);
    var intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5, sub);
    if (types) {
      intersections = intersections.filter((intersection: Intersection) => {
        return types.includes(intersection.description);
      });
    }
    if (intersections.length === 0) this.reset();
    if (intersections.length === 1) {
      INSTANCE.getCommandManager().handleClickResult(intersections[0]);
      return;
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
      li.onmouseenter = function() {
        cursor.setPosition(INSTANCE.getScene().getCamera().getPixelAtPoint(intersection.point));
      };
      list.appendChild(li);
    }

    this.element.setAttribute("style", `
      left:${mousePos[0] + 20}px;
      top:${mousePos[1] - 20}px;
      width:auto;
      height:auto;`
    );

  }

  public destroy(): void {
    cursor.hide();
    document.body.removeChild(this.element);
  }

  public getPoint(): Vec3 | null {
    return this.point;
  }

  reset() {
    console.log("reset");
    this.clicked = false;
    this.element.hidden = true;
  }

}
