import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { getScaleTransform } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum ScaleCommandMode {
  SelectCenterPoint,
  SelectFromPoint,
  SelectToPointOrFactor,
}

export class ScaleCommand extends Command {

  private finished: boolean;
  private mode: ScaleCommandMode;
  private centerPoint: Vec3 | null;
  private fromPoint: Vec3 | null;
  private toPoint: Vec3 | null;
  private clicker: Clicker;
  private clones: Geometry[];

  constructor() {
    super();
    this.finished = false;
    this.mode = ScaleCommandMode.SelectCenterPoint;
    this.centerPoint = null;
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
      clone.delete(); // invisible clones for intersection
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
    if (this.mode === ScaleCommandMode.SelectToPointOrFactor) {
      const factor: number = parseFloat(input);
      if (!isNaN(factor)) {
        const scaleTransform = getScaleTransform(this.centerPoint!, factor);
        INSTANCE.getMover().setTransform(scaleTransform);
        INSTANCE.getSelector().onSelectionMoved();
        this.done();
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case ScaleCommandMode.SelectCenterPoint:
        this.centerPoint = intersection.point;
        this.clicker.reset();
        this.mode = ScaleCommandMode.SelectFromPoint;
        break;
      case ScaleCommandMode.SelectFromPoint:
        this.fromPoint = intersection.point;
        this.clicker.reset();
        this.mode = ScaleCommandMode.SelectToPointOrFactor;
        break;
      case ScaleCommandMode.SelectToPointOrFactor:
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
    if (this.mode == ScaleCommandMode.SelectToPointOrFactor) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        this.toPoint = point;
        this.setScale();
      }
    }
  }

  getInstructions(): string {
    switch (this.mode) {
      case ScaleCommandMode.SelectCenterPoint:
        return "0:Exit  Click center point.  $"
      case ScaleCommandMode.SelectFromPoint:
        return "0:Exit  Click from point.  $"
      case ScaleCommandMode.SelectToPointOrFactor:
        return "0:Exit  Click to point or enter factor.  $"
      default:
        throw new Error("case not implemented");
    }
  }

  private setScale(): void {
    const factor: number =
      vec3.distance(this.centerPoint!, this.toPoint!) /
      vec3.distance(this.centerPoint!, this.fromPoint!);
    const toOrigin: Mat4 = mat4.translation(vec3.scale(this.centerPoint!, -1));
    const toPos: Mat4 = mat4.translation(this.centerPoint!);
    const scale: Mat4 = mat4.uniformScaling(factor);
    const transform: Mat4 = mat4.mul(mat4.mul(toPos, scale), toOrigin);
    INSTANCE.getMover().setTransform(transform);
    INSTANCE.getSelector().onSelectionMoved();
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();

    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    for (const geo of selection) {
      INSTANCE.getScene().addGeometry(geo);
    }

    for (const clone of this.clones) {
      INSTANCE.getScene().removeGeometry(clone);
    }

    INSTANCE.getSelector().transformSelected();
    INSTANCE.getMover().updatedSelection();
  }

  isFinished(): boolean {
    return this.finished;
  }

}
