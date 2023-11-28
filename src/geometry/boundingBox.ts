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

  public getXMin(): number { return this.xMin; }
  public getYMin(): number { return this.yMin; }
  public getZMin(): number { return this.zMin; }
  public getXMax(): number { return this.xMax; }
  public getYMax(): number { return this.yMax; }
  public getZMax(): number { return this.zMax; }

  public print(): void {
    console.log(`BB: x: [${this.xMin}, ${this.xMax}], y: [${this.yMin}, ${this.yMax}], z: [${this.zMin}, ${this.zMax}];`);
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

  public hasNoVolume(): boolean {
    return this.xMin === this.xMax &&
      this.yMin === this.yMax &&
      this.zMin === this.zMax;
  }

  public getCenter(): Vec3 {
    const res: Vec3 = vec3.create(
      (this.xMin + this.xMax) / 2,
      (this.yMin + this.yMax) / 2,
      (this.zMin + this.zMax) / 2,
    );
    if (isNaN(res[0])) res[0] = 0;
    if (isNaN(res[1])) res[1] = 0;
    if (isNaN(res[2])) res[2] = 0;
    return res;
  }

  public contains(bb: BoundingBox): boolean {
    return this.xMin <= bb.xMin &&
      this.yMin <= bb.yMin &&
      this.zMin <= bb.zMin &&
      this.xMax >= bb.xMax &&
      this.yMax >= bb.yMax &&
      this.zMax >= bb.zMax;
  }

}
