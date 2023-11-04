import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { BoundingBox } from "./boundingBox";
import { Line } from "./line";
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
    const topRight: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(left, right);
    const bottomLeft: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(bottom, top);
    const bottomRight: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(bottom, right);
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

  public containsLineFully(line: Line): boolean {
    return this.containsPoint(line.getStart()) && this.containsPoint(line.getEnd());
  }

  public containsLinePartially(line: Line): boolean {

    var dir: Vec3 = vec3.sub(line.getEnd(), line.getStart());

    const size: number = vec3.length(dir);
    dir = vec3.scale(dir, 1 / size);

    const r: Ray = new Ray(line.getStart(), dir);

    const tUp: number = r.intersectPlane(new Plane(this.origin, this.up)) ?? 0;
    const tRight: number = r.intersectPlane(new Plane(this.origin, this.right)) ?? 0;
    const tDown: number = r.intersectPlane(new Plane(this.origin, this.down)) ?? 0;
    const tLeft: number = r.intersectPlane(new Plane(this.origin, this.left)) ?? 0;

    var near: number = 0;
    var far: number = size;

    if (vec3.dot(this.up, dir) < 0) far = Math.min(far, tUp); else near = Math.max(near, tUp);
    if (vec3.dot(this.right, dir) < 0) far = Math.min(far, tRight); else near = Math.max(near, tRight);
    if (vec3.dot(this.down, dir) < 0) far = Math.min(far, tDown); else near = Math.max(near, tDown);
    if (vec3.dot(this.left, dir) < 0) far = Math.min(far, tLeft); else near = Math.max(near, tLeft);

    return near <= far;

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

  public containsBoundingBoxPartially(bb: BoundingBox): boolean {
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

}


