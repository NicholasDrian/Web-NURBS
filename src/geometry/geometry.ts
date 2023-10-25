import { Mat4 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";

export abstract class Geometry {

  public abstract getBoundingBox(): BoundingBox;
  public abstract getModel(): Mat4;

}
