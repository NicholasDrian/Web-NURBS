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
