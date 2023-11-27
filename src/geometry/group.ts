import { Mat4, mat4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
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

  public addToSubSelection(subID: number): void {
    throw new Error("Method not implemented.");
  }
  public removeFromSubSelection(subID: number): void {
    throw new Error("Method not implemented.");
  }
  public isSubSelected(subID: number): boolean {
    throw new Error("Method not implemented.");
  }
  public clearSubSelection(): void {
    throw new Error("todo");
  }
  public getSubSelectionBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public onSelectionMoved(): void {
    throw new Error("Method not implemented.");
  }
  public bakeSelectionTransform(): void {
    throw new Error("Method not implemented.");
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

  public override intersect(ray: Ray): Intersection | null {

    if (this.isHidden()) return null;

    var res: Intersection | null = null;
    for (const child of this.children) {
      const intersection: Intersection | null = child.intersect(ray);
      if (intersection) {
        if (!res) res = intersection;
        else if (intersection.time < res.time) res = intersection;
      }
    }
    return res;
  }

}
