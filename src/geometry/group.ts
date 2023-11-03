import { Mat4, mat4 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
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
  }

  public override getBoundingBox(): BoundingBox {
    const boundingBox: BoundingBox = new BoundingBox();
    for (let child of this.children) {
      boundingBox.addBoundingBox(child.getBoundingBox());
    }
    return boundingBox;
  }
  public override intersect(ray: Ray): Intersection | null {
    throw new Error("not implemented");
  }

}
