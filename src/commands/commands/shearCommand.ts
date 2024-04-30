import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Plane } from "../../geometry/plane";
import { getShearTransform } from "../../utils/math";
import { printMat4 } from "../../utils/print";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum ShearCommandMode {
  SelectFirstPoint,
  SelectSecondPoint,
  SelectThirdPoint,
  SelectBasePoint,
  SelectToPoint,
}

// FIX:
export class ShearCommand extends Command {

  private finished: boolean;
  private mode: ShearCommandMode;
  private clicker: Clicker;
  private clones: Geometry[];
  private p1: Vec3 | null;
  private p2: Vec3 | null;
  private plane: Plane | null;
  private basePoint: Vec3 | null;


  constructor() {
    super();
    this.finished = false;
    this.mode = ShearCommandMode.SelectFirstPoint;
    this.clicker = new Clicker();
    this.plane = null;
    this.p1 = null;
    this.p2 = null;
    this.basePoint = null;
    this.clones = [];

    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
      return;
    }
    for (const geo of selection) {
      this.clones.push(geo.clone());
      const clone: Geometry = geo.clone();
      INSTANCE.getScene().addGeometry(clone);
      this.clones.push(clone);
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
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case ShearCommandMode.SelectFirstPoint:
        this.p1 = intersection.point;
        this.mode = ShearCommandMode.SelectSecondPoint;
        break;
      case ShearCommandMode.SelectSecondPoint:
        this.p2 = intersection.point;
        this.mode = ShearCommandMode.SelectThirdPoint;
        break;
      case ShearCommandMode.SelectThirdPoint:
        this.plane = new Plane(
          intersection.point,
          vec3.cross(
            vec3.sub(this.p1!, intersection.point),
            vec3.sub(this.p2!, intersection.point)
          )
        );
        this.mode = ShearCommandMode.SelectBasePoint;
        break;
      case ShearCommandMode.SelectBasePoint:
        this.basePoint = intersection.point;
        this.mode = ShearCommandMode.SelectToPoint;
        break;
      case ShearCommandMode.SelectToPoint:
        const from: Vec3 = vec3.sub(this.basePoint!, this.plane!.getOrigin());
        const to: Vec3 = vec3.sub(intersection.point, this.plane!.getOrigin());
        const t: Mat4 = getShearTransform(this.plane!, from, to);
        printMat4(t);
        INSTANCE.getMover().setTransform(t);
        INSTANCE.getSelector().onSelectionMoved();
        this.done();
        break;
      default: throw new Error("case not implemented");
    }
    this.clicker.reset();
  }

  handleClick(): void {
    this.clicker.click();
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode == ShearCommandMode.SelectToPoint) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        const from: Vec3 = vec3.sub(this.basePoint!, this.plane!.getOrigin());
        const to: Vec3 = vec3.sub(point, this.plane!.getOrigin());
        const t: Mat4 = getShearTransform(this.plane!, from, to);
        console.log(t);
        INSTANCE.getMover().setTransform(t);
        INSTANCE.getSelector().onSelectionMoved();
      }
    }

  }

  getInstructions(): string {
    switch (this.mode) {
      case ShearCommandMode.SelectFirstPoint:
        return "0:Exit  Select first point on shear plane.  $";
      case ShearCommandMode.SelectSecondPoint:
        return "0:Exit  Select second point on shear plane.  $";
      case ShearCommandMode.SelectThirdPoint:
        return "0:Exit  Select third point on shear plane.  $";
      case ShearCommandMode.SelectBasePoint:
        return "0:Exit  Select base point.  $";
      case ShearCommandMode.SelectToPoint:
        return "0:Exit  Select to point.  $";
      default: throw new Error("case not implemented");
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
      clone.delete();
    }

    INSTANCE.getSelector().transformSelected();
    INSTANCE.getMover().updatedSelection();
  }

}
