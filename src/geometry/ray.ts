import { mat4, Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Scene } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
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

  public intersectPlane(plane: Plane, allowNegative: boolean = false): number | null {
    const numerator: number = vec3.dot(vec3.sub(plane.getOrigin(), this.origin), plane.getNormal());
    const denominator: number = vec3.dot(this.direction, plane.getNormal());
    if (denominator === 0) { // parallel case
      // NOTE: might need to look into this
      return null;
    }
    const t: number = numerator / denominator;
    if (allowNegative) return t;
    if (t < 0) return null;
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
    const maxDist: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(dist) * pixels;

    const min: Vec3 = vec3.create(bb.getXMin() - maxDist, bb.getYMin() - maxDist, bb.getZMin() - maxDist);
    const max: Vec3 = vec3.create(bb.getXMax() + maxDist, bb.getYMax() + maxDist, bb.getZMax() + maxDist);

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
    return Math.max(start, 0.00001); // so its truthy

  }

  // always posotive
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
    return Math.max(start, 0.00001); // so its truthy

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
    const newOrigin: Vec4 = vec4.transformMat4(vec4.create(...ray.origin, 1), mat);
    const newDirection: Vec4 = vec4.transformMat4(vec4.create(...ray.direction, 0), mat);
    return new Ray(
      vec3.create(newOrigin[0], newOrigin[1], newOrigin[2]),
      vec3.create(newDirection[0], newDirection[1], newDirection[2])
    );
  }

  public almostIntersectLine(geo: Geometry, subID: number, start: Vec3, end: Vec3, pixels: number): Intersection | null {

    const p: Vec3 = vec3.add(this.origin, this.direction);

    const v13: Vec3 = vec3.sub(start, this.origin);
    const v43: Vec3 = vec3.sub(p, this.origin);
    const v21: Vec3 = vec3.sub(end, start);

    const d1343: number = vec3.dot(v13, v43);
    const d4321: number = vec3.dot(v43, v21);
    const d1321: number = vec3.dot(v13, v21);
    const d4343: number = vec3.dot(v43, v43);
    const d2121: number = vec3.dot(v21, v21);

    var mua: number = (d1343 * d4321 - d1321 * d4343) / (d2121 * d4343 - d4321 * d4321);
    const mub: number = (d1343 + mua * d4321) / d4343;
    mua = Math.max(Math.min(mua, 1), 0);

    // p line
    const pLine: Vec3 = vec3.add(start, vec3.scale(v21, mua));
    //p ray
    const pRay: Vec3 = vec3.add(this.origin, vec3.scale(v43, mub));


    const distToIntersection: number = vec3.distance(this.origin, pLine);
    const closest: number = vec3.distance(pLine, pRay);
    const sizeOfPixel: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(distToIntersection);

    if (closest < sizeOfPixel * pixels) {
      return new Intersection(mub, "line", geo, subID, pLine, closest, closest * sizeOfPixel);
    } else {
      return null;
    }

  }

  almostIntersectPoint(geometry: Geometry, subID: number, point: Vec3, pixels: number,): Intersection | null {

    const toPoint: Vec3 = vec3.sub(point, this.origin);
    const time: number = vec3.dot(toPoint, this.direction);
    if (time <= 0) return null;

    const pointOnRay: Vec3 = this.at(time);
    const dist: number = vec3.distance(pointOnRay, point);
    const sizeOfPixel: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(time);

    if (dist < sizeOfPixel * pixels) {
      return new Intersection(time, "point", geometry, subID, point, dist, dist * sizeOfPixel)
    } else {
      return null;
    }

  }

  public closestPointOnLine(start: Vec3, end: Vec3): Vec3 {

    const p: Vec3 = vec3.add(this.origin, this.direction);

    const v13: Vec3 = vec3.sub(start, this.origin);
    const v43: Vec3 = vec3.sub(p, this.origin);
    const v21: Vec3 = vec3.sub(end, start);

    const d1343: number = vec3.dot(v13, v43);
    const d4321: number = vec3.dot(v43, v21);
    const d1321: number = vec3.dot(v13, v21);
    const d4343: number = vec3.dot(v43, v43);
    const d2121: number = vec3.dot(v21, v21);

    const denom: number = d2121 * d4343 - d4321 * d4321;
    if (denom === 0) return vec3.clone(start);
    var mua: number = (d1343 * d4321 - d1321 * d4343) / denom;

    const res: Vec3 = vec3.add(start, vec3.scale(v21, mua));
    return res;

  }

  public closestPointToLine(start: Vec3, end: Vec3): Vec3 {
    const p: Vec3 = vec3.add(this.origin, this.direction);

    const v13: Vec3 = vec3.sub(start, this.origin);
    const v43: Vec3 = vec3.sub(p, this.origin);
    const v21: Vec3 = vec3.sub(end, start);

    const d1343: number = vec3.dot(v13, v43);
    const d4321: number = vec3.dot(v43, v21);
    const d1321: number = vec3.dot(v13, v21);
    const d4343: number = vec3.dot(v43, v43);
    const d2121: number = vec3.dot(v21, v21);

    var mua: number = (d1343 * d4321 - d1321 * d4343) / (d2121 * d4343 - d4321 * d4321);
    const mub: number = (d1343 + mua * d4321) / d4343;

    return vec3.add(this.origin, vec3.scale(v43, mub));
  }

  public closestDistanceToPoint(point: Vec3): number {
    const op: Vec3 = vec3.sub(point, this.origin);
    const a: number = vec3.dot(op, this.direction);
    const b: number = vec3.length(op);
    return Math.sqrt(b * b + a * a);
  }
  public closestPointToPoint(point: Vec3): Vec3 {
    const op: Vec3 = vec3.sub(point, this.origin);
    const a: number = vec3.dot(op, this.direction);
    return this.at(a);
  }

}
