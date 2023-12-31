import { INSTANCE } from "../cad";
import { Frustum } from "../geometry/frustum";
import { Geometry } from "../geometry/geometry";
import { Intersection } from "../geometry/intersection";
import { Ray } from "../geometry/ray";
import { Scene } from "../scene/scene";


export class Selector {

  private selection: Set<Geometry> = new Set<Geometry>;
  private element: HTMLElement;
  private selecting: boolean;

  constructor() {
    this.selecting = false;
    this.element = document.createElement("div");
    this.element.id = "clicker";
    this.element.className = "floating-window";
    this.element.style.width = "auto";
    this.element.hidden = true;
    document.body.appendChild(this.element);
  }

  public reset(): void {
    for (let geo of this.selection) {
      geo.unSelect();
    }
    this.selection.clear();
    INSTANCE.getMover().updatedSelection();
  }

  public addToSubSelection(geos: Geometry[], subIDss: number[][]): void {
    for (let i = 0; i < geos.length; i++) {
      let geo: Geometry = geos[i];
      const subIDs: number[] = subIDss[i];
      if (subIDs.length > 0 && subIDs[0] === -1) {
        this.addToSelection(geo);
        continue;
      }
      while (!INSTANCE.getScene().containsGeometry(geo) && geo.getParent()) geo = geo.getParent()!;
      this.selection.add(geo);
      geo.addToSubSelection(...subIDs);
    }
  }


  public removeFromSubSelection(geos: Geometry[], subIDss: number[][]): void {
    for (let i = 0; i < geos.length; i++) {
      let geo: Geometry = geos[i];
      const subIDs: number[] = subIDss[i];
      if (subIDs.length > 0 && subIDs[0] === -1) {
        this.removeFromSelection(geo);
        continue;
      }
      while (!INSTANCE.getScene().containsGeometry(geo) && geo.getParent()) geo = geo.getParent()!;
      geo.removeFromSubSelection(...subIDs);
      if (!geo.hasSubSelection()) {
        this.selection.delete(geo);
      }
    }
  }

  public addToSelection(...geometry: Geometry[]): void {
    for (let geo of geometry) {
      while (!INSTANCE.getScene().containsGeometry(geo) && geo.getParent()) geo = geo.getParent()!;
      this.selection.add(geo);
      geo.select();
    }
  }

  public removeFromSelection(...geometry: Geometry[]): void {
    for (let geo of geometry) {
      while (!INSTANCE.getScene().containsGeometry(geo) && geo.getParent()) geo = geo.getParent()!;
      this.selection.delete(geo);
      geo.unSelect();
    }
  }

  public onSelectionMoved(): void {
    for (const geo of this.selection) {
      geo.onSelectionMoved();
    }
  }

  public toggleSelectionAtPixel(x: number, y: number, sub: boolean): void {

    if (this.selecting) {
      this.doneTogglingSelectionAtPixel(null);
      return;
    }
    this.selecting = true;

    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
    const intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 2, sub);
    const list: HTMLElement = document.createElement("ul");
    this.element.innerHTML = "";
    this.element.appendChild(list);
    const geometryAtPixel: [Geometry, number][] = [];
    for (let intersection of intersections) {

      if (intersection.geometry === null) continue; // construction plane intersection

      if (intersection.description != "control cage") {
        intersection.objectSubID = -1;
      }

      let geo: Geometry = intersection.geometry;// TODO: chase parent
      geometryAtPixel.push([geo, intersection.objectSubID]);

      const li = document.createElement("li");
      li.innerText = intersection.description;
      li.onclick = function() {
        if (sub) {
          INSTANCE.getSelector().doneTogglingSelectionAtPixel(geo, intersection.objectSubID);
        } else {
          INSTANCE.getSelector().doneTogglingSelectionAtPixel(geo);
        }
      };
      li.onmouseover = function() { geo.hover(); };
      li.onmouseleave = function() { geo.unHover(); }
      list.appendChild(li);
    }

    if (geometryAtPixel.length === 0) {
      this.doneTogglingSelectionAtPixel(null);
      return;
    }
    if (geometryAtPixel.length === 1) {
      if (sub) {
        this.doneTogglingSelectionAtPixel(geometryAtPixel[0][0], geometryAtPixel[0][1]);
      } else {
        this.doneTogglingSelectionAtPixel(geometryAtPixel[0][0]);
      }
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

  private doneTogglingSelectionAtPixel(geo: Geometry | null, subID?: number): void {
    if (geo !== null) {
      geo.unHover();
      if (subID !== undefined && subID !== -1) {
        if (geo.isSubSelected(subID)) {
          this.removeFromSubSelection([geo], [[subID]]);
        } else {
          this.addToSubSelection([geo], [[subID]]);
        }
      } else {
        if (geo.isSelected()) {
          this.removeFromSelection(geo);
        } else {
          this.addToSelection(geo);
        }
      }
    }
    INSTANCE.getMover().updatedSelection();
    this.selecting = false;
    this.element.hidden = true;
  }

  public selectInRectangle(left: number, right: number, top: number, bottom: number, inclusive: boolean, sub: boolean): void {
    right = Math.max(right, left + 1);
    bottom = Math.max(bottom, top + 1);
    const frustum: Frustum = new Frustum(left, right, top, bottom);
    if (sub) {
      const within: [Geometry[], number[][]] = INSTANCE.getScene().getBoundingBoxHeirarchy().getWithinFrustumSub(frustum, inclusive);
      this.addToSubSelection(...within);
    } else {
      const within: Geometry[] = INSTANCE.getScene().getBoundingBoxHeirarchy().getWithinFrustum(frustum, inclusive);
      for (const geo of within) {
        this.addToSelection(geo);
      }
    }
    INSTANCE.getMover().updatedSelection();
  }

  public unSelectInRectangle(left: number, right: number, top: number, bottom: number, inclusive: boolean, sub: boolean): void {
    right = Math.max(right, left + 1);
    bottom = Math.max(bottom, top + 1);
    const frustum: Frustum = new Frustum(left, right, top, bottom);
    if (sub) {
      const within: [Geometry[], number[][]] = INSTANCE.getScene().getBoundingBoxHeirarchy().getWithinFrustumSub(frustum, inclusive);
      this.removeFromSubSelection(...within);
    } else {
      const within: Geometry[] = INSTANCE.getScene().getBoundingBoxHeirarchy().getWithinFrustum(frustum, inclusive);
      for (const geo of within) {
        this.removeFromSelection(geo);
      }
    }
    INSTANCE.getMover().updatedSelection();
  }

  public getSelection(): Set<Geometry> {
    return this.selection;
  }

  public transformSelected() {
    const scene: Scene = INSTANCE.getScene();
    for (const geo of this.selection) {
      scene.getBoundingBoxHeirarchy().remove(geo);
      geo.bakeSelectionTransform();
      scene.getBoundingBoxHeirarchy().add(geo);
    }
  }

}
