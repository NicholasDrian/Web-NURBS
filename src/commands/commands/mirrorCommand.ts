import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Plane } from "../../geometry/plane";
import { getMirrorTransform } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum MirrorCommandMode {
  SelectFirstPoint,
  SelectSecondPoint,
  SelectThirdPoint,
}

export class MirrorCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private oldToNew: Map<Geometry, Geometry>;
  private mode: MirrorCommandMode;
  private pointA: Vec3 | null;
  private pointB: Vec3 | null;
  private pointC: Vec3 | null;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.oldToNew = new Map<Geometry, Geometry>();
    this.mode = MirrorCommandMode.SelectFirstPoint;
    this.pointA = null;
    this.pointB = null;
    this.pointC = null;
    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
    }
  }

  public handleInputString(input: string): void {
    if (input == "0") this.done();
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        break;
      case MirrorCommandMode.SelectSecondPoint:
        break;
      case MirrorCommandMode.SelectThirdPoint:
        if (input == "") {
          this.pointC = null;
          this.applyMirror();
          this.done();
        }
        break;
      default:
        throw new Error("case not implemented");
    }

  }

  public handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        this.pointA = intersection.point;
        const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
        for (const geometry of selection) {
          this.oldToNew.set(geometry, geometry.clone());
        }
        this.mode = MirrorCommandMode.SelectSecondPoint;
        this.clicker.reset();
        break;
      case MirrorCommandMode.SelectSecondPoint:
        this.pointB = intersection.point;
        this.applyMirror();
        this.mode = MirrorCommandMode.SelectThirdPoint;
        this.clicker.reset();
        break;
      case MirrorCommandMode.SelectThirdPoint:
        this.applyMirror();
        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  public handleClick(): void {
    this.clicker.click();
  }

  public handleMouseMove(): void {
    this.clicker.onMouseMove();
    const point: Vec3 | null = this.clicker.getPoint();
    if (point) {
      if (this.mode === MirrorCommandMode.SelectSecondPoint) this.pointB = point;
      else if (this.mode === MirrorCommandMode.SelectThirdPoint) this.pointC = point;
      this.applyMirror();
    }
  }

  public getInstructions(): string {
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        return "0:Exit  Click first point on mirror plane.  $";
      case MirrorCommandMode.SelectSecondPoint:
        return "0:Exit  Click second point on mirror plane.  $";
      case MirrorCommandMode.SelectThirdPoint:
        return "0:Exit  Click optional third point on mirror plane.  $";
      default:
        throw new Error("case not implemented");
    }
  }

  public isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    for (let geo of this.oldToNew.values()) {
      INSTANCE.getScene().addGeometry(geo);
    }
  }

  private applyMirror(): void {
    if (this.pointC) {
      const v1: Vec3 = vec3.sub(this.pointA!, this.pointB!);
      const v2: Vec3 = vec3.sub(this.pointA!, this.pointC!);
      const mirrorPlane: Plane = new Plane(this.pointA!, vec3.cross(v1, v2));
      const mirrorTransform: Mat4 = getMirrorTransform(mirrorPlane);
      for (const [oldGeo, newGeo] of this.oldToNew) {
        newGeo.setModel(mat4.mul(mirrorTransform, oldGeo.getModel()));
      }
    } else if (this.pointB) {
      const dir: Vec3 = vec3.sub(this.pointA!, this.pointB!);
      if (dir[0] === 0 && dir[1] === 0) return;
      dir[2] = 0;
      const mirrorPlane: Plane = new Plane(this.pointA!, vec3.cross(vec3.create(0, 0, 1), dir));
      const mirrorTransform: Mat4 = getMirrorTransform(mirrorPlane);
      for (const [oldGeo, newGeo] of this.oldToNew) {
        newGeo.setModel(mat4.mul(mirrorTransform, oldGeo.getModel()));
      }
    }
  }

}

