import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { ConstructionPlane } from "../scene/constructionPlane";
import { Scene } from "../scene/scene";
import { printVec3 } from "../utils/print";
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

  public intersectScene(scene: Scene): Intersection | null {
    const intersection: Intersection | null = scene.getBoundingBoxHeirarchy().firstPositiveIntersection(this);
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

  // returns time, dist, pLine
  public almostIntersectLine(start: Vec3, end: Vec3, pixels: number): [number, number, Vec3] | null {

    const p1: Vec3 = start;
    const p2: Vec3 = end;
    const p3: Vec3 = this.origin;
    const p4: Vec3 = vec3.add(this.origin, this.direction);

    const v13: Vec3 = vec3.sub(p1, p3);
    const v43: Vec3 = vec3.sub(p4, p3);
    const v21: Vec3 = vec3.sub(p2, p1);

    const d1343: number = vec3.dot(v13, v43);
    const d4321: number = vec3.dot(v43, v21);
    const d1321: number = vec3.dot(v13, v21);
    const d4343: number = vec3.dot(v43, v43);
    const d2121: number = vec3.dot(v21, v21);

    const mua: number = (d1343 * d4321 - d1321 * d4343) / (d2121 * d4343 - d4321 * d4321);
    const mub: number = (d1343 + mua * d4321) / d4343;

    // p line
    const pa: Vec3 = vec3.add(p1, vec3.scale(v21, mua));
    //p ray
    const pb: Vec3 = vec3.add(p3, vec3.scale(v43, mub));


    const distToIntersection: number = vec3.distance(this.origin, pb);
    const closest: number = vec3.distance(pa, pb);
    const sizeOfPixel: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(distToIntersection);

    if (closest < sizeOfPixel * pixels) {
      return [mub, closest, pa];
    } else {
      return null;
    }

    /*
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

    //const tRay: number = (ab * bc + ac * bb) / denom;
    const length: number = vec3.distance(start, end);
    const tLine: number = Math.min(Math.max((ab * ac - bc * aa) / denom, 0), length);
    const tRay: number = (ab + tLine * ac) / aa / length;
    const pRay: Vec3 = this.at(tRay);
    const pLine: Vec3 = vec3.add(B, vec3.scale(b, tLine));
    this.print();
    console.log("t ray", tRay);
    console.log("pray, pline");
    printVec3(pRay);
    printVec3(pLine);
    const closest: number = vec3.distance(pRay, pLine);
    const distToIntersection: number = vec3.distance(this.origin, pRay);
    const sizeOfPixel: number = INSTANCE.getScene().getCamera().pixelSizeAtDist(distToIntersection);
    console.log("size of pix", sizeOfPixel);
    console.log("closest", closest);
    if (closest < sizeOfPixel * pixels) {
      console.log("HERERERERERERERERERERE");
      return [tRay, closest];
    }
    return null;
*/
  }

}
