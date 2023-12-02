import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Plane } from "../../geometry/plane";
import { Ray } from "../../geometry/ray";
import { angleBetween, getRotationTransform } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";


enum RotateCommandMode {
  SelectCenterPoint,
  SelectAxisPoint,
  SelectFromPointOrAngle,
  SelectToPoint,
}

export class RotateCommand extends Command {

  private mode: RotateCommandMode;
  private clicker: Clicker;
  private center: Vec3 | null;
  private axis: Ray | null;
  private fromPoint: Vec3 | null;
  private finished: boolean;
  private clones: Geometry[];

  constructor() {
    super();
    this.mode = RotateCommandMode.SelectCenterPoint;
    this.clicker = new Clicker();
    this.center = null;
    this.axis = null;
    this.fromPoint = null;
    this.finished = false;
    this.clones = [];


    const selected: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selected.size === 0) {
      this.done();
      return;
    }

    for (const geo of selected) {
      const clone: Geometry = geo.clone();
      clone.delete(); // an invisible clone just for intersecting with.
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
    if (this.mode === RotateCommandMode.SelectFromPointOrAngle) {
      const val: number = parseFloat(input);
      if (!isNaN(val)) {
        const rotationMatrix: Mat4 = getRotationTransform(this.axis!, val / 180 * Math.PI);
        INSTANCE.getMover().setTransform(rotationMatrix);
        INSTANCE.getSelector().onSelectionMoved();
        this.done();
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case RotateCommandMode.SelectCenterPoint:
        this.center = intersection.point;
        this.mode = RotateCommandMode.SelectAxisPoint;
        break;
      case RotateCommandMode.SelectAxisPoint:
        this.axis = new Ray(this.center!, vec3.sub(intersection.point, this.center!));
        this.mode = RotateCommandMode.SelectFromPointOrAngle;
        break;
      case RotateCommandMode.SelectFromPointOrAngle:
        if (this.axis!.closestDistanceToPoint(intersection.point) > 0.0001) {
          this.fromPoint = intersection.point;
          this.mode = RotateCommandMode.SelectToPoint;
        }
        break;
      case RotateCommandMode.SelectToPoint:
        if (this.axis!.closestDistanceToPoint(intersection.point) > 0.0001) {
          if (this.updateRotation(intersection.point)) {
            this.done();
          }
        }
        break;
      default:
        throw new Error("case not implemented");
    }
    this.clicker.reset();
  }

  private updateRotation(toPoint: Vec3): boolean {
    const origin1: Vec3 = this.axis!.closestPointToPoint(this.center!);
    const origin2: Vec3 = this.axis!.closestPointToPoint(toPoint);
    const v1 = vec3.sub(this.fromPoint!, origin1);
    const v2 = vec3.sub(toPoint, origin2);
    var theta: number = angleBetween(v1, v2);
    if (vec3.dot(v2, vec3.cross(v1, this.axis!.getDirection())) > 0) {
      theta = 2 * Math.PI - theta;
    }
    if (isNaN(theta) || theta === 0) return false;
    const rotation: Mat4 = getRotationTransform(this.axis!, theta);
    INSTANCE.getMover().setTransform(rotation);
    INSTANCE.getSelector().onSelectionMoved();
    return true;
  }

  handleClick(): void {
    this.clicker.click();
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode === RotateCommandMode.SelectToPoint) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        this.updateRotation(point);
      }
    }
  }

  getInstructions(): string {
    switch (this.mode) {
      case RotateCommandMode.SelectCenterPoint:
        return "0:Exit  Click center point.  $";
      case RotateCommandMode.SelectAxisPoint:
        return "0:Exit  Click axis point.  $";
      case RotateCommandMode.SelectFromPointOrAngle:
        return "0:Exit  Select start point of rotation or enter angle.  $";
      case RotateCommandMode.SelectToPoint:
        return "0:Exit  Select point to rotate to.  $";
      default:
        throw new Error("case not implemented");
    }
  }
  isFinished(): boolean {
    return this.finished;
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

}
