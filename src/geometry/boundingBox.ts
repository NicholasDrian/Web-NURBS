import { vec3, Vec3 } from "wgpu-matrix";

export class BoundingBox {

  constructor(
    private xMin: number = Infinity,
    private xMax: number = -Infinity,
    private yMin: number = Infinity,
    private yMax: number = -Infinity,
    private zMin: number = Infinity,
    private zMax: number = -Infinity
  ) {

  }

  public addVec3(v: Vec3): void {
    this.xMin = Math.min(this.xMin, v[0]);
    this.yMin = Math.min(this.yMin, v[1]);
    this.zMin = Math.min(this.zMin, v[2]);
    this.xMax = Math.max(this.xMax, v[0]);
    this.yMax = Math.max(this.yMax, v[1]);
    this.zMax = Math.max(this.zMax, v[2]);
  }

  public addBoundingBox(bb: BoundingBox): void {
    this.xMin = Math.min(this.xMin, bb.xMin);
    this.yMin = Math.min(this.yMin, bb.yMin);
    this.zMin = Math.min(this.zMin, bb.zMin);
    this.xMax = Math.max(this.xMax, bb.xMax);
    this.yMax = Math.max(this.yMax, bb.yMax);
    this.zMax = Math.max(this.zMax, bb.zMax);
  }

  public getCenter(): Vec3 {
    return vec3.create(
      (this.xMin + this.xMax) / 2,
      (this.yMin + this.yMax) / 2,
      (this.zMin + this.zMax) / 2,
    );
  }

}
