import { mat4, Mat4 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";
import { Ray } from "./ray";

export abstract class Geometry {

  constructor(
    private parent: Geometry | null = null
  ) { }
  private model: Mat4 = mat4.identity();

  public abstract getBoundingBox(): BoundingBox;
  public abstract intersect(ray: Ray): number | null;

  public setModel(model: Mat4): void {
    this.model = model;
  }
  public getModel(): Mat4 {
    if (this.parent) {
      return mat4.mul(this.parent.getModel(), this.model);
    } else {
      return this.model;
    }
  }


}
