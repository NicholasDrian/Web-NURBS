import { vec3, Vec3 } from "wgpu-matrix"


export class Plane {

  constructor(
    private origin: Vec3,
    private normal: Vec3
  ) {
    this.normal = vec3.normalize(this.normal);
  }

  public getOrigin(): Vec3 {
    return this.origin;
  }

  public getNormal(): Vec3 {
    return this.normal;
  }

  public getXY(): [Vec3, Vec3] {
    // NOTE: could break, probably wont.
    const perturbed: Vec3 = vec3.clone(this.normal);
    perturbed[0] *= 0.043283;
    perturbed[1] += 4.33423;
    perturbed[2] /= 32.324;
    const yAxis: Vec3 = vec3.normalize(vec3.cross(perturbed, this.normal));
    const xAxis: Vec3 = vec3.cross(yAxis, this.getNormal());
    return [xAxis, yAxis];
  }

}
