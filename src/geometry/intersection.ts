import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Geometry } from "./geometry";

export class Intersection {


  constructor(
    public time: number,
    public description: string,
    public geometry: Geometry | null,
    public objectSubID: number,
    public point: Vec3,
    public dist: number,
    public screenSpaceDist: number
  ) { }

  public transform(transform: Mat4): void {
    // TODO: verify this
    const scale: Vec3 = mat4.getScaling(transform);
    const scaleFactor: number = vec3.length(scale) / Math.sqrt(3);
    this.time *= scaleFactor;
    this.dist *= scaleFactor;
    this.screenSpaceDist /= scaleFactor;
    this.point = vec3.transformMat4(this.point, transform);
  }

}
