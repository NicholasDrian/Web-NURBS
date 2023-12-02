import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Plane } from "../../geometry/plane";
import { getScale1Transform } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum Scale1CommandMode {
  ClickBasePoint,
  ClickFromPoint,
  ClickToPointOrFactor,
}

export class Scale1Command extends Command {

  private finished: boolean;
  private mode: Scale1CommandMode;
  private basePoint: Vec3 | null;
  private fromPoint: Vec3 | null;
  private toPoint: Vec3 | null;
  private clicker: Clicker;
  private clones: Geometry[];

  constructor() {
    super();
    this.finished = false;
    this.mode = Scale1CommandMode.ClickBasePoint;
    this.basePoint = null;
    this.fromPoint = null;
    this.toPoint = null;
    this.clicker = new Clicker();
    this.clones = [];

    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
      return;
    }
    for (const geo of selection) {
      const clone: Geometry = geo.clone();
      clone.delete(); // invisible clone for intersecting
      this.clones.push(clone);
      INSTANCE.getScene().addGeometry(clone);
      INSTANCE.getScene().removeGeometry(geo);
    }

  }

  handleInputString(input: string): void {
    if (input == "0") {
      INSTANCE.getMover().setTransform(mat4.identity());
      INSTANCE.getSelector().onSelectionMoved();
      this.done();
      return;
    }
    if (this.mode === Scale1CommandMode.ClickToPointOrFactor) {
      const factor: number = parseFloat(input);
      if (!isNaN(factor)) {
        const vFrom: Vec3 = vec3.sub(this.fromPoint!, this.basePoint!);
        const transform: Mat4 = getScale1Transform(new Plane(this.basePoint!, vFrom), factor);
        INSTANCE.getMover().setTransform(transform);
        INSTANCE.getSelector().onSelectionMoved();
        this.done();
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case Scale1CommandMode.ClickBasePoint:
        this.basePoint = intersection.point;
        this.mode = Scale1CommandMode.ClickFromPoint;
        this.clicker.reset();
        break;
      case Scale1CommandMode.ClickFromPoint:
        this.fromPoint = intersection.point;
        this.mode = Scale1CommandMode.ClickToPointOrFactor;
        this.clicker.reset();
        break;
      case Scale1CommandMode.ClickToPointOrFactor:
        this.toPoint = intersection.point;
        this.setScale();
        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  handleClick(): void {
    this.clicker.click();
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode == Scale1CommandMode.ClickToPointOrFactor) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        this.toPoint = point;
        this.setScale();
      }
    }
  }

  getInstructions(): string {
    switch (this.mode) {
      case Scale1CommandMode.ClickBasePoint:
        return "0:Exit  Click base point.  $";
      case Scale1CommandMode.ClickFromPoint:
        return "0:Exit  Click from point.  $";
      case Scale1CommandMode.ClickToPointOrFactor:
        return "0:Exit  Click to point or enter factor.  $";
      default:
        throw new Error("case not implemented");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private setScale(): void {
    const vFrom: Vec3 = vec3.sub(this.fromPoint!, this.basePoint!);
    const vTo: Vec3 = vec3.sub(this.toPoint!, this.basePoint!);
    const lFrom: number = vec3.length(vFrom);
    const lTo: number = vec3.dot(vTo, vec3.normalize(vFrom));
    const factor: number = lTo / lFrom;
    const transform: Mat4 = getScale1Transform(new Plane(this.basePoint!, vFrom), factor);
    INSTANCE.getMover().setTransform(transform);
    INSTANCE.getSelector().onSelectionMoved();
  }

  private done() {
    this.finished = true;
    this.clicker.destroy();

    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    for (const geo of selection) {
      INSTANCE.getScene().addGeometry(geo);
    }

    for (const clone of this.clones) {
      INSTANCE.getScene().removeGeometry(clone);
      clone.delete();
    }

    INSTANCE.getSelector().transformSelected();
    INSTANCE.getMover().updatedSelection();
  }

}
