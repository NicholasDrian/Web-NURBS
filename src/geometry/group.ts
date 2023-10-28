import { Mat4, mat4 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Ray } from "./ray";

export class Group extends Geometry {

  constructor(
    parent: Geometry | null = null,
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
  }

  public override getBoundingBox(): BoundingBox {
    throw new Error("not implemented");
  }
  public override intersect(ray: Ray): number | null {
    throw new Error("not implemented");
  }

}
