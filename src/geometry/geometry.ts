import { Mat4 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";
import { Ray } from "./ray";

export abstract class Geometry {

  public abstract getBoundingBox(): BoundingBox;
  public abstract getModel(): Mat4;
  public abstract intersect(ray: Ray): number | null;

}
