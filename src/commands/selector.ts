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

  public removeFromSelection(...geometry: Geometry[]): void {
    for (let geo of geometry) {
      this.selection.delete(geo.getID());
      geo.unSelect();
    }
    console.log("removing from selectin");
  }

  public toggleSelectionAtPixel(x: number, y: number, sub: boolean): void {
    console.log("selecting at pixel");
    if (this.selecting) return;
    this.selecting = true;
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
    const intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5);
    const list: HTMLElement = document.createElement("ul");
    this.element.innerHTML = "";
    this.element.appendChild(list);
    const geometryAtPixel: Set<Geometry> = new Set<Geometry>;
    for (let intersection of intersections) {

      if (intersection.object === 0) continue; // construction plane intersection
      let geo: Geometry = INSTANCE.getScene().getGeometry(intersection.object);
      if (sub) {
        while (geo.getParent()) geo = geo.getParent()!;
        if (geometryAtPixel.has(geo)) continue;
      }
      geometryAtPixel.add(geo);

      const li = document.createElement("li");
      li.innerText = intersection.description;
      li.onclick = function() {
        geo.unHover();
        if (geo.isSelected()) {
          INSTANCE.getSelector().removeFromSelection(geo);
        } else {
          INSTANCE.getSelector().addToSelection(geo);
        }
        INSTANCE.getSelector().doneSelecting();
      };
      li.onmouseover = function() { geo.hover(); };
      li.onmouseleave = function() { geo.unHover(); }
      list.appendChild(li);
    }

    if (geometryAtPixel.size === 0) {
      this.doneSelecting();
      return;
    }
    if (geometryAtPixel.size === 1) {
      const geo: Geometry = geometryAtPixel.values().next().value;
      if (geo.isSelected()) {
        INSTANCE.getSelector().removeFromSelection(geo);
      } else {
        INSTANCE.getSelector().addToSelection(geo);
      }
      this.doneSelecting();
      return;
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
    console.log(this.selection);
  }

  public selectInRectangle(left: number, top: number, right: number, bottom: number, inclusive: boolean, sub: boolean): void {

  }

  public unSelectInRectangle(left: number, top: number, right: number, bottom: number, inclusive: boolean, sub: boolean): void {

  }

  public getSelection(): Set<ObjectID> {
    return this.selection;
  }

}
