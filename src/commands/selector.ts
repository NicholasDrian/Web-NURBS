import { mat4, Mat4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Frustum } from "../geometry/frustum";
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
    INSTANCE.getMover().updatedSelection();
  }

  public updateTransform(mat: Mat4): void {
    this.transform = mat;
  }

  public getTransform(): Mat4 {
    return this.transform;
  }

  public addToSelection(...geometry: Geometry[]): void {
    for (let geo of geometry) {
      console.log("selected", geo.getID(), geo.getTypeName());
      this.selection.add(geo.getID());
      geo.select();
    }
    INSTANCE.getMover().updatedSelection();
  }

  public removeFromSelection(...geometry: Geometry[]): void {
    for (let geo of geometry) {
      this.selection.delete(geo.getID());
      geo.unSelect();
    }
    INSTANCE.getMover().updatedSelection();
  }

  public toggleSelectionAtPixel(x: number, y: number, sub: boolean): void {
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
      if (!sub) {
        while (geo.getParent() !== null) geo = geo.getParent()!;
        if (geometryAtPixel.has(geo)) continue;
      }
      geometryAtPixel.add(geo);

      const li = document.createElement("li");
      li.innerText = intersection.description;
      li.onclick = function() {
        INSTANCE.getSelector().doneTogglingSelectionAtPixel(geo);
      };
      li.onmouseover = function() { geo.hover(); };
      li.onmouseleave = function() { geo.unHover(); }
      list.appendChild(li);
    }

    if (geometryAtPixel.size === 0) {
      this.doneTogglingSelectionAtPixel(null);
      return;
    }
    if (geometryAtPixel.size === 1) {
      const geo: Geometry = geometryAtPixel.values().next().value;
      this.doneTogglingSelectionAtPixel(geo);
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

  private doneTogglingSelectionAtPixel(geo: Geometry | null): void {
    if (geo !== null) {
      geo.unHover();
      if (geo.isSelected()) {
        INSTANCE.getSelector().removeFromSelection(geo);
      } else {
        INSTANCE.getSelector().addToSelection(geo);
      }
    }
    this.selecting = false;
    this.element.hidden = true;
  }

  public selectInRectangle(left: number, right: number, top: number, bottom: number, inclusive: boolean, sub: boolean): void {
    const frustum: Frustum = new Frustum(left, right, top, bottom);
    const within: ObjectID[] = INSTANCE.getScene().getBoundingBoxHeirarchy().getWithinFrustum(frustum, sub, inclusive);
    for (const obj of within) {
      const geo: Geometry = INSTANCE.getScene().getGeometry(obj);
      this.addToSelection(geo);
    }
  }

  public unSelectInRectangle(left: number, right: number, top: number, bottom: number, inclusive: boolean, sub: boolean): void {
    const frustum: Frustum = new Frustum(left, right, top, bottom);
    const within: ObjectID[] = INSTANCE.getScene().getBoundingBoxHeirarchy().getWithinFrustum(frustum, sub, inclusive);
    for (const obj of within) {
      const geo: Geometry = INSTANCE.getScene().getGeometry(obj);
      this.removeFromSelection(geo);
    }
  }

  public getSelection(): Set<ObjectID> {
    return this.selection;
  }

}
