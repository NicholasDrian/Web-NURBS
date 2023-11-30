import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { loft } from "../../geometry/nurbs/loft";
import { Surface } from "../../geometry/nurbs/surface";
import { Plane } from "../../geometry/plane";
import { Ray } from "../../geometry/ray";
import { getScale1Transform } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum ExtrudeCurveCommandMode {
  SelectCurves,
  Base,
  Direction,
  Distance
}

export class ExtruedCurveCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private mode: ExtrudeCurveCommandMode;
  private base: Vec3 | null;
  private dir: Vec3 | null;
  private dist: number | null;
  private surfaces: Surface[];
  private curves: Curve[];

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.mode = ExtrudeCurveCommandMode.SelectCurves;
    this.base = null;
    this.dir = null;
    this.dist = null;
    this.surfaces = [];
    this.curves = [];
    INSTANCE.getSelector().reset();
  }

  handleInputString(input: string): void {
    if (input == "0") {
      for (const surface of this.surfaces) surface.delete();
      this.surfaces = [];
      this.done();
    }
    else if (this.mode === ExtrudeCurveCommandMode.SelectCurves) {
      if (this.curves.length === 0) {
        this.done();
      } else {
        this.mode = ExtrudeCurveCommandMode.Base;
      }
    }
    else if (this.mode === ExtrudeCurveCommandMode.Distance) {
      const val: number = parseInt(input);
      if (!isNaN(val)) {
        this.dist = val;
        this.updateSurfaces();
        this.done();
      }
    }
  }

  private updateSurfaces() {

    for (const surface of this.surfaces) surface.delete();
    this.surfaces = [];

    for (let i = 0; i < this.curves.length; i++) {
      const clone: Curve = <Curve>this.curves[i].clone();
      const translation: Mat4 = mat4.translation(vec3.scale(this.dir!, this.dist!));
      clone.setModel(mat4.mul(translation, clone.getModel()));
      this.surfaces.push(loft([this.curves[i], clone], 1));
      clone.delete();
    }

  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case ExtrudeCurveCommandMode.SelectCurves:
        const curve: Curve = <Curve>intersection.geometry;
        curve.select();
        this.curves.push(curve);
        break;
      case ExtrudeCurveCommandMode.Base:
        this.base = intersection.point;
        this.mode = ExtrudeCurveCommandMode.Direction;
        break;
      case ExtrudeCurveCommandMode.Direction:
        if (!vec3.equals(intersection.point, this.base!)) {
          this.dir = vec3.normalize(vec3.sub(
            intersection.point,
            this.base!
          ));
          this.dist = 1;
          this.updateSurfaces();
          this.mode = ExtrudeCurveCommandMode.Distance;
        }
        break;
      case ExtrudeCurveCommandMode.Distance:
        const ray: Ray = new Ray(this.base!, this.dir!);
        const dirPoint: Vec3 = ray.closestPointToPoint(intersection.point);
        this.dist = vec3.dot(this.dir!, vec3.sub(dirPoint, this.base!));
        this.updateSurfaces();
        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
    this.clicker.reset();
  }

  handleClick(): void {
    if (this.mode === ExtrudeCurveCommandMode.SelectCurves) {
      this.clicker.click(["curve"]);
    } else {
      this.clicker.click();
    }
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode === ExtrudeCurveCommandMode.Distance) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        const ray: Ray = new Ray(this.base!, this.dir!);
        const dirPoint: Vec3 = ray.closestPointToPoint(point);
        this.dist = vec3.dot(this.dir!, vec3.sub(dirPoint, this.base!));
        this.updateSurfaces();
      }
    }
  }

  getInstructions(): string {
    switch (this.mode) {
      case ExtrudeCurveCommandMode.SelectCurves:
        return "0:Exit  Select curves.  $";
      case ExtrudeCurveCommandMode.Base:
        return "0:Exit  Select base point.  $";
      case ExtrudeCurveCommandMode.Direction:
        return "0:Exit  Select direction point.  $";
      case ExtrudeCurveCommandMode.Distance:
        return "0:Exit  Select distance point or enter number.  $";
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
    for (const surface of this.surfaces) {
      INSTANCE.getScene().addGeometry(surface);
    }
    for (const curve of this.curves) {
      curve.unSelect();
    }
  }

}
