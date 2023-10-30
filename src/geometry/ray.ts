import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { ConstructionPlane } from "../scene/constructionPlane";
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

  public almostIntersectBoundingBox(bb: BoundingBox, pixels: number): number | null {

    const dxMin = Math.abs(this.origin[0] - bb.getXMin());
    const dyMin = Math.abs(this.origin[1] - bb.getYMin());
    const dzMin = Math.abs(this.origin[2] - bb.getZMin());
    const dxMax = Math.abs(this.origin[0] - bb.getXMax());
    const dyMax = Math.abs(this.origin[1] - bb.getYMax());
    const dzMax = Math.abs(this.origin[2] - bb.getZMax());

    const farthest: Vec3 = vec3.create(
      dxMin < dxMax ? bb.getXMax() : bb.getXMin(),
      dyMin < dyMax ? bb.getYMax() : bb.getYMin(),
      dzMin < dzMax ? bb.getZMax() : bb.getZMin(),
    )

    const dist: number = vec3.distance(this.origin, farthest);
    const delta: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(dist) * pixels;

    const min: Vec3 = vec3.create(bb.getXMin() - delta, bb.getYMin() - delta, bb.getZMin() - delta);
    const max: Vec3 = vec3.create(bb.getXMax() - delta, bb.getYMax() - delta, bb.getZMax() - delta);

    if (this.direction[0] < 0) [min[0], max[0]] = [max[0], min[0]];
    if (this.direction[1] < 0) [min[1], max[1]] = [max[1], min[1]];
    if (this.direction[2] < 0) [min[2], max[2]] = [max[2], min[2]];

    var xMin: number = this.intersectPlane(new Plane(min, vec3.create(1, 0, 0)), true) ?? -Infinity;
    var yMin: number = this.intersectPlane(new Plane(min, vec3.create(0, 1, 0)), true) ?? -Infinity;
    var zMin: number = this.intersectPlane(new Plane(min, vec3.create(0, 0, 1)), true) ?? -Infinity;
    var xMax: number = this.intersectPlane(new Plane(max, vec3.create(1, 0, 0)), true) ?? Infinity;
    var yMax: number = this.intersectPlane(new Plane(max, vec3.create(0, 1, 0)), true) ?? Infinity;
    var zMax: number = this.intersectPlane(new Plane(max, vec3.create(0, 0, 1)), true) ?? Infinity;

    const end = Math.min(xMax, Math.min(yMax, zMax));
    const start = Math.max(xMin, Math.max(yMin, zMin));

    if (end < 0 || start > end) return null;
    return Math.max(start, 0);



  }

  public intersectBoundingBox(bb: BoundingBox): number | null {

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

    const end = Math.min(xMax, Math.min(yMax, zMax));
    const start = Math.max(xMin, Math.max(yMin, zMin));

    if (end < 0 || start > end) return null;
    return Math.max(start, 0);

  }

  public intersectScene(scene: Scene): number | null {
    const intersection: number | null = scene.getBoundingBoxHeirarchy().firstIntersection(this);
    if (intersection !== null) return intersection;
    return null;
  }

  public intersectTriangle(p1: Vec3, p2: Vec3, p3: Vec3): number | null {

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

  public almostIntersectLine(start: Vec3, end: Vec3, pixels: number): number | null {
    const a: Vec3 = this.direction;
    const b: Vec3 = vec3.normalize(vec3.sub(end, start));
    if (a === b) {
      return null;
    }
    const B: Vec3 = start;
    const A: Vec3 = this.origin;
    const c: Vec3 = vec3.sub(B, A);

    const ab: number = vec3.dot(a, b);
    const ac: number = vec3.dot(a, c);
    const bc: number = vec3.dot(b, c);
    const aa: number = vec3.dot(a, a);
    const bb: number = vec3.dot(b, b);

    const denom: number = aa * bb - ab * ab;
    if (denom === 0) {
      throw new Error("You're fired!");
      // TODO: figure out whats happening here
    }

    const tRay: number = (ab * bc + ac * bb) / denom;
    const length: number = vec3.distance(start, end);
    const tLine: number = Math.min(Math.max((ab * ac - bc * aa) / denom, 0), length);
    const pRay: Vec3 = this.at(tRay);
    const pLine: Vec3 = this.at(tLine);
    const closest: number = vec3.distance(pRay, pLine);
    const distToIntersection: number = vec3.distance(this.origin, pRay);
    const sizeOfPixel: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(distToIntersection);
    if (closest < sizeOfPixel * pixels) {
      return tRay;
    }
    return null;

  }

}
