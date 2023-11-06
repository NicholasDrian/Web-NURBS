import { mat4, Mat4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Geometry } from "../geometry/geometry";
import { Intersection } from "../geometry/intersection";
import { Ray } from "../geometry/ray";
import { ObjectID } from "../scene/scene";



export class Selector {

  private selection: Set<ObjectID> = new Set<ObjectID>;
  private transform!: Mat4;
  private element: HTMLElement;
  private selecting: boolean;

  constructor() {
    this.selecting = false;
    this.updateTransform(mat4.identity());
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
    this.transform = mat4.identity();
  }

  public updateTransform(mat: Mat4): void {
    this.transform = mat;
  }

  public getTransform(): Mat4 {
    return this.transform;
  }

  public addToSelection(...geometry: Geometry[]): void {
    for (let geo of geometry) {
      this.selection.add(geo.getID());
      geo.select();
    }
  }

  public selectAtPixel(x: number, y: number, sub: boolean): void {
    console.log("here");
    if (this.selecting) return;
    this.selecting = true;
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
    const intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5);
    if (intersections.length == 0) return;
    if (intersections.length == 1) {
      if (intersections[0].object === 0) return;
      const geo: Geometry = INSTANCE.getScene().getGeometry(intersections[0].object);
      this.addToSelection(geo);
      this.doneSelecting();
      return;
    }
    const list: HTMLElement = document.createElement("ul");
    this.element.innerHTML = "";
    this.element.appendChild(list);
    const found: Set<Geometry> = new Set<Geometry>;
    for (let intersection of intersections) {

      if (intersection.object === 0) continue; // construction plane intersection

      var geo: Geometry = INSTANCE.getScene().getGeometry(intersection.object);

      if (sub) {
        while (geo.getParent()) geo = geo.getParent()!;
        if (found.has(geo)) continue;
        found.add(geo);
      }

      const li = document.createElement("li");
      li.innerText = intersection.description;
      li.onclick = function() {
        geo.unHover();
        INSTANCE.getSelector().addToSelection(geo);
        INSTANCE.getSelector().doneSelecting();
      };
      li.onmouseover = function() {
        geo.hover();
      };
      li.onmouseleave = function() {
        geo.unHover();
      }
      list.appendChild(li);
    }

    this.element.setAttribute("style", `
      left:${x}px;
      top:${y}px;
      width:auto;
      height:auto;`
    );
    this.element.hidden = false;
  }

  public doneSelecting(): void {
    this.selecting = false;
    this.element.hidden = true;
  }

  public unSelectAtPixel(x: number, y: number, sub: boolean): void {

  }

  public selectInRectangle(left: number, top: number, right: number, bottom: number, inclusive: boolean, sub: boolean): void {

  }

  public unSelectInRectangle(left: number, top: number, right: number, bottom: number, inclusive: boolean, sub: boolean): void {

  }

  public getSelection(): Set<ObjectID> {
    return this.selection;
  }

}
