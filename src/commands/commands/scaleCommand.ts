import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum ScaleCommandMode {
  SelectCenterPoint,
  SelectFromPoint,
  SelectToPoint,
}

export class ScaleCommand extends Command {

  private finished: boolean;
  private mode: ScaleCommandMode;
  private centerPoint: Vec3 | null;
  private fromPoint: Vec3 | null;
  private toPoint: Vec3 | null;
  private clicker: Clicker;
  private objectsToScale: Map<Geometry, Mat4>;

  constructor() {
    super();
    this.finished = false;
    this.mode = ScaleCommandMode.SelectCenterPoint;
    this.centerPoint = null;
    this.fromPoint = null;
    this.toPoint = null;
    this.clicker = new Clicker();
    this.objectsToScale = new Map<Geometry, Mat4>();

    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
      return;
    }

    for (const geo of selection) {
      this.objectsToScale.set(
        geo, geo.getModel()
      );
      INSTANCE.getScene().removeGeometry(geo);
    }

  }
  handleInputString(input: string): void {
    if (input == "0") {
      for (const [geo, transform] of this.objectsToScale) {
        geo.setModel(transform);
      }
      this.done();
      return;
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
        this.mode = ScaleCommandMode.SelectToPoint;
        break;
      case ScaleCommandMode.SelectToPoint:
        this.toPoint = intersection.point;
        this.setScale();
        this.done();
      default:
        throw new Error("case not implemented");
    }
  }
  handleClick(): void {
    this.clicker.click();;
  }
  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode == ScaleCommandMode.SelectToPoint) {
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
      case ScaleCommandMode.SelectToPoint:
        return "0:Exit  Click to point.  $"
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
    for (const [geo, originalTransform] of this.objectsToScale) {
      geo.setModel(mat4.mul(transform, originalTransform));
    }
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    for (const geo of this.objectsToScale.keys()) {
      INSTANCE.getScene().addGeometry(geo);
    }
    INSTANCE.getMover().updatedSelection();
  }

  isFinished(): boolean {
    return this.finished;
  }

}
