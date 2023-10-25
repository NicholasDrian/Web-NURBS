import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Scene } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Plane } from "./plane";

export class Ray {

  constructor(
    private origin: Vec3,
    private direction: Vec3
  ) {
    this.direction = vec3.normalize(this.direction);
  }

  public print(): void {
    console.log(`RAY: origin: ${this.origin.toString()}, direction: ${this.direction.map((n: number) => {
      return Math.round(n * 100);
    }).toString()}`);
  }

  public getOrigin(): Vec3 {
    return this.origin;
  }

  public getDirection(): Vec3 {
    return this.direction;
  }

  public at(time: number): Vec3 {
    return vec3.add(this.origin, vec3.scale(this.direction, time));
  }

  //todo make sure res is positive
  public intersectPlane(plane: Plane, allowNegative: boolean = false): number | null {
    const numerator: number = vec3.dot(vec3.sub(plane.getOrigin(), this.origin), plane.getNormal());
    const denominator: number = vec3.dot(this.direction, plane.getNormal());
    if (denominator === 0) { // parallel case
      return null;
    }
    const t: number = numerator / denominator;
    if (allowNegative) return t;
    if (t <= 0) return null;
    return t;
  }

  public intersectBoundingBox(bb: BoundingBox) {

    console.log("intersecting bounding box");
    this.print();
    bb.print();
    const min: Vec3 = vec3.create(bb.getXMin(), bb.getYMin(), bb.getZMin());
    const max: Vec3 = vec3.create(bb.getXMax(), bb.getYMax(), bb.getZMax());

    if (this.direction[0] < 0) [min[0], max[0]] = [max[0], min[0]];
    if (this.direction[1] < 0) [min[1], max[1]] = [max[1], min[1]];
    if (this.direction[2] < 0) [min[2], max[2]] = [max[2], min[2]];

    var xMin: number = this.intersectPlane(new Plane(min, vec3.create(1, 0, 0)), true) ?? -Infinity;
    var yMin: number = this.intersectPlane(new Plane(min, vec3.create(0, 1, 0)), true) ?? -Infinity;
    var zMin: number = this.intersectPlane(new Plane(min, vec3.create(0, 0, 1)), true) ?? -Infinity;
    var xMax: number = this.intersectPlane(new Plane(max, vec3.create(1, 0, 0)), true) ?? Infinity;
    var yMax: number = this.intersectPlane(new Plane(max, vec3.create(0, 1, 0)), true) ?? Infinity;
    var zMax: number = this.intersectPlane(new Plane(max, vec3.create(0, 0, 1)), true) ?? Infinity;
    console.log(xMin, xMax, yMin, yMax, zMin, zMax);

    const end = Math.min(xMax, Math.min(yMax, zMax));
    const start = Math.max(xMin, Math.max(yMin, zMin));

    console.log(`start ${start} end ${end}`);
    if (end < 0 || start > end) return null;
    return Math.max(start, 0);

  }

  public intersectScene(scene: Scene): number | null {
    const intersection: number | null = scene.getBoundingBoxHeirarchy().firstIntersection(this);
    if (intersection !== null) return intersection;
    return this.intersectPlane(new Plane(vec3.create(0, 0, 0), vec3.create(0, 0, 1)));
  }

  public intersectTriangle(p1: Vec3, p2: Vec3, p3: Vec3): number | null {
    console.log("intersecting triangle");
    const v12 = vec3.sub(p2, p1);
    const v13 = vec3.sub(p3, p1);
    const normal = vec3.normalize(vec3.cross(v12, v13));
    const denom = vec3.dot(normal, this.direction);
    if (denom === 0) return null;
    const t = vec3.dot(vec3.sub(p1, this.origin), normal) / denom;
    if (t < 0) return null;

    const point: Vec3 = this.at(t);

    const d1 = vec3.dot(normal, vec3.cross(vec3.sub(point, p1), vec3.sub(p2, p1)));
    const d2 = vec3.dot(normal, vec3.cross(vec3.sub(point, p2), vec3.sub(p3, p2)));
    const d3 = vec3.dot(normal, vec3.cross(vec3.sub(point, p3), vec3.sub(p1, p3)));

    if (
      // remove one of these lines for back face culling.
      d1 > 0 && d2 > 0 && d3 > 0 ||
      d1 < 0 && d2 < 0 && d3 < 0
    ) return t;
    else return null;
  }

  public static transform(ray: Ray, mat: Mat4): Ray {
    return new Ray(
      vec3.add(ray.origin, mat4.getTranslation(mat)),
      vec3.transformMat4(ray.direction, mat)
    );
  }


}
