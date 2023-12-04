import { mat4, Mat4, vec3, Vec3, Vec4, vec4 } from "wgpu-matrix";
import { Geometry } from "./geometry";
import { Ray } from "./ray";

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

  public transform(transform: Mat4, ray: Ray): void {

    const newDirection: Vec4 = vec4.transformMat4(vec4.create(...ray.getDirection(), 0), transform);
    const scale: number = vec4.length(newDirection);


    this.time *= scale;
    this.dist *= scale;

    this.screenSpaceDist /= scale; // Maybe?

    this.point = vec3.transformMat4(this.point, transform);
  }

}
