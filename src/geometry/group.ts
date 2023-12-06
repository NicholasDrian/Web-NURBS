import { Mat4, mat4 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";

export class Group extends Geometry {

  constructor(
    private children: Geometry[],
    parent: Geometry | null = null,
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    for (const child of children) {
      child.setParent(this);
    }
  }

  public addToSubSelection(...subIDs: number[]): void {
    alert("todo group");
  }
  public removeFromSubSelection(...subIDs: number[]): void {
    alert("todo group");
  }
  public isSubSelected(subID: number): boolean {
    alert("todo group");
    return false;
  }
  public hasSubSelection(): boolean {
    alert("todo group");
    return false;
  }

  public clearSubSelection(): void {
    for (const geo of this.children) geo.clearSubSelection();
  }
  public getSubSelectionBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    for (const geo of this.children) res.addBoundingBox(geo.getSubSelectionBoundingBox());
    return res;
  }
  public onSelectionMoved(): void {
    for (const geo of this.children) geo.onSelectionMoved();
  }
  public bakeSelectionTransform(): void {
    for (const geo of this.children) geo.bakeSelectionTransform();
  }
  public showControls(on: boolean): void {
    for (const geo of this.children) geo.showControls(on);
  }

  public override getBoundingBox(): BoundingBox {
    const boundingBox: BoundingBox = new BoundingBox();
    for (let child of this.children) {
      boundingBox.addBoundingBox(child.getBoundingBox());
    }
    return boundingBox;
  }

  public override getTypeName(): string {
    return "Group";
  }

  public delete(): void {
    for (const child of this.children) {
      child.delete();
    }
  }

  public clone(): Geometry {
    return new Group(this.children.map((geo: Geometry) => { return geo.clone(); }), this.parent, mat4.clone(this.model), this.materialName);
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    if (inclusive) {
      for (const geo of this.children) {
        if (geo.isWithinFrustum(frustum, inclusive)) return true;
      }
      return false;
    } else {
      for (const geo of this.children) {
        if (!geo.isWithinFrustum(frustum, inclusive)) return false;
      }
      return true;
    }
  }

  public override intersect(ray: Ray, sub: boolean): Intersection | null {

    if (this.isHidden()) return null;

    var res: Intersection | null = null;
    for (const child of this.children) {
      const intersection: Intersection | null = child.intersect(ray, sub);
      if (intersection) {
        if (!res) res = intersection;
        else if (intersection.time < res.time) res = intersection;
      }
    }
    return res;
  }

}
