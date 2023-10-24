import { BoundingBox } from "./boundingBox";

export abstract class Geometry {

  public abstract getBoundingBox(): BoundingBox;

}
