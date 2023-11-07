import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { BoundingBox } from "./boundingBox";
import { Plane } from "./plane";
import { Ray } from "./ray";

export class Frustum {

  private origin: Vec3;
  private up: Vec3;
  private right: Vec3;
  private down: Vec3;
  private left: Vec3;

  constructor(left: number, right: number, top: number, bottom: number) {
    this.origin = INSTANCE.getScene().getCamera().getPosition();
    const topLeft: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(left, top);
    const topRight: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(right, top);
    const bottomLeft: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(left, bottom);
    const bottomRight: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(right, bottom);
    this.up = vec3.normalize(vec3.cross(topLeft.getDirection(), topRight.getDirection()));
    this.right = vec3.normalize(vec3.cross(topRight.getDirection(), bottomRight.getDirection()));
    this.down = vec3.normalize(vec3.cross(bottomRight.getDirection(), bottomLeft.getDirection()));
    this.left = vec3.normalize(vec3.cross(bottomLeft.getDirection(), topLeft.getDirection()));
  }


  public containsPoint(point: Vec3): boolean {
    const v: Vec3 = vec3.sub(point, this.origin);
    return vec3.dot(this.up, v) > 0 &&
      vec3.dot(this.right, v) > 0 &&
      vec3.dot(this.down, v) > 0 &&
      vec3.dot(this.left, v) > 0;
  }

  public containsLineFully(a: Vec3, b: Vec3): boolean {
    return this.containsPoint(a) && this.containsPoint(b);
  }

  public containsLinePartially(a: Vec3, b: Vec3): boolean {

    var dir: Vec3 = vec3.sub(b, a);

    const size: number = vec3.length(dir);
    dir = vec3.scale(dir, 1 / size);

    const r: Ray = new Ray(a, dir);

    const tUp: number = r.intersectPlane(new Plane(this.origin, this.up), true) ?? 0;
    const tRight: number = r.intersectPlane(new Plane(this.origin, this.right), true) ?? 0;
    const tDown: number = r.intersectPlane(new Plane(this.origin, this.down), true) ?? 0;
    const tLeft: number = r.intersectPlane(new Plane(this.origin, this.left), true) ?? 0;

    var near: number = 0;
    var far: number = size;

    if (vec3.dot(this.up, dir) < 0) far = Math.min(far, tUp); else near = Math.max(near, tUp);
    if (vec3.dot(this.right, dir) < 0) far = Math.min(far, tRight); else near = Math.max(near, tRight);
    if (vec3.dot(this.down, dir) < 0) far = Math.min(far, tDown); else near = Math.max(near, tDown);
    if (vec3.dot(this.left, dir) < 0) far = Math.min(far, tLeft); else near = Math.max(near, tLeft);

    return near <= far;

  }

  public containsTriangle(p1: Vec3, p2: Vec3, p3: Vec3, inclusive: boolean) {
    if (inclusive) {
      const tr: Ray = new Ray(this.origin, vec3.cross(this.up, this.right));
      if (tr.intersectTriangle(p1, p2, p3)) return true;
      const br: Ray = new Ray(this.origin, vec3.cross(this.right, this.down));
      if (br.intersectTriangle(p1, p2, p3)) return true;
      const bl: Ray = new Ray(this.origin, vec3.cross(this.down, this.left));
      if (bl.intersectTriangle(p1, p2, p3)) return true;
      const tl: Ray = new Ray(this.origin, vec3.cross(this.left, this.up));
      if (tl.intersectTriangle(p1, p2, p3)) return true;
      return this.containsPoint(p1) || this.containsPoint(p2) || this.containsPoint(p3);
    } else {
      return this.containsPoint(p1) && this.containsPoint(p2) && this.containsPoint(p3);
    }
  }

  public intersectsBoundingBox(boundingBox: BoundingBox): boolean {
    // if frustum ray intersects boundingBox then there is an intersection
    const tr: Ray = new Ray(this.origin, vec3.cross(this.up, this.right));
    if (tr.intersectBoundingBox(boundingBox)) return true;
    const br: Ray = new Ray(this.origin, vec3.cross(this.right, this.down));
    if (br.intersectBoundingBox(boundingBox)) return true;
    const bl: Ray = new Ray(this.origin, vec3.cross(this.down, this.left));
    if (bl.intersectBoundingBox(boundingBox)) return true;
    const tl: Ray = new Ray(this.origin, vec3.cross(this.left, this.up));
    if (tl.intersectBoundingBox(boundingBox)) return true;

    if (this.containsBoundingBoxCorner(boundingBox)) return true;

    return false;
  }

  public containsBoundingBoxFully(bb: BoundingBox): boolean {
    const p000: Vec3 = vec3.create(bb.getXMin(), bb.getYMin(), bb.getZMin());
    const p001: Vec3 = vec3.create(bb.getXMin(), bb.getYMin(), bb.getZMax());
    const p010: Vec3 = vec3.create(bb.getXMin(), bb.getYMax(), bb.getZMin());
    const p011: Vec3 = vec3.create(bb.getXMin(), bb.getYMax(), bb.getZMax());
    const p100: Vec3 = vec3.create(bb.getXMax(), bb.getYMin(), bb.getZMin());
    const p101: Vec3 = vec3.create(bb.getXMax(), bb.getYMin(), bb.getZMax());
    const p110: Vec3 = vec3.create(bb.getXMax(), bb.getYMax(), bb.getZMin());
    const p111: Vec3 = vec3.create(bb.getXMax(), bb.getYMax(), bb.getZMax());
    return this.containsPoint(p000) &&
      this.containsPoint(p001) &&
      this.containsPoint(p010) &&
      this.containsPoint(p011) &&
      this.containsPoint(p100) &&
      this.containsPoint(p101) &&
      this.containsPoint(p110) &&
      this.containsPoint(p111);
  }

  private containsBoundingBoxCorner(bb: BoundingBox): boolean {
    // TODO: fix this
    const p000: Vec3 = vec3.create(bb.getXMin(), bb.getYMin(), bb.getZMin());
    const p001: Vec3 = vec3.create(bb.getXMin(), bb.getYMin(), bb.getZMax());
    const p010: Vec3 = vec3.create(bb.getXMin(), bb.getYMax(), bb.getZMin());
    const p011: Vec3 = vec3.create(bb.getXMin(), bb.getYMax(), bb.getZMax());
    const p100: Vec3 = vec3.create(bb.getXMax(), bb.getYMin(), bb.getZMin());
    const p101: Vec3 = vec3.create(bb.getXMax(), bb.getYMin(), bb.getZMax());
    const p110: Vec3 = vec3.create(bb.getXMax(), bb.getYMax(), bb.getZMin());
    const p111: Vec3 = vec3.create(bb.getXMax(), bb.getYMax(), bb.getZMax());
    return this.containsPoint(p000) ||
      this.containsPoint(p001) ||
      this.containsPoint(p010) ||
      this.containsPoint(p011) ||
      this.containsPoint(p100) ||
      this.containsPoint(p101) ||
      this.containsPoint(p110) ||
      this.containsPoint(p111);
  }

  public print(): void {
    console.log("Frustum:");
    console.log("\torigin: ", this.origin);
    console.log("\ttop: ", this.up);
    console.log("\tright: ", this.right);
    console.log("\tbottom: ", this.down);
    console.log("\tleft: ", this.left);
  }

}


