import { vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { Ray } from "../../geometry/ray";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum BlendCurvesCommandMode {
  SelectCurve1,
  SelectCurve2,
  Menu,
  AdjustEnd1,
  AdjustEnd2,
}

export class BlendCurvesCommand extends Command {

  private finished: boolean;
  private mode: BlendCurvesCommandMode;
  private curve: Curve | null;
  private clicker: Clicker;
  private useStartOfCurve1: boolean;
  private useStartOfCurve2: boolean;
  private curve1: Curve | null;
  private curve2: Curve | null;
  private ray1: Ray | null;
  private ray2: Ray | null;
  private p1: Vec3 | null;
  private p2: Vec3 | null;

  constructor() {
    super();
    this.finished = false;
    this.mode = BlendCurvesCommandMode.SelectCurve1;
    this.curve = null;
    this.clicker = new Clicker();
    this.useStartOfCurve1 = true;
    this.useStartOfCurve2 = true;
    this.ray1 = null;
    this.ray2 = null;
    this.curve1 = null;
    this.curve2 = null;
    this.p1 = null;
    this.p2 = null;
  }

  handleInputString(input: string): void {
    if (input == "0") {
      this.curve?.delete();
      this.curve = null;
      this.done();
    } else {
      if (this.mode === BlendCurvesCommandMode.Menu) {
        switch (input) {
          case "":
            this.done();
            break;
          case "1": {// flip 1
            const dist: number = vec3.distance(this.ray1!.getOrigin(), this.p1!);
            if (this.useStartOfCurve1) {
              this.ray1 = this.curve1!.getEndRay();
            } else {
              this.ray1 = this.curve1!.getStartRay();
            }
            this.useStartOfCurve1 = !this.useStartOfCurve1;
            this.p1 = this.ray1.at(dist);
            this.generateCurve();
            break;
          }
          case "2": {// flip 2
            const dist: number = vec3.distance(this.ray2!.getOrigin(), this.p2!);
            if (this.useStartOfCurve2) {
              this.ray2 = this.curve2!.getEndRay();
            } else {
              this.ray2 = this.curve2!.getStartRay();
            }
            this.useStartOfCurve2 = !this.useStartOfCurve2;
            this.p2 = this.ray2.at(dist);
            this.generateCurve();
            break;
          }
          case "3": // adjust 1
            this.mode = BlendCurvesCommandMode.AdjustEnd1;
            break;
          case "4": // adjust 2
            this.mode = BlendCurvesCommandMode.AdjustEnd2;
            break;
        }
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case BlendCurvesCommandMode.SelectCurve1:
        this.curve1 = <Curve>intersection.geometry;
        this.mode = BlendCurvesCommandMode.SelectCurve2;
        break;
      case BlendCurvesCommandMode.SelectCurve2:
        this.curve2 = <Curve>intersection.geometry;
        this.mode = BlendCurvesCommandMode.Menu;
        this.ray1 = this.curve1!.getStartRay();
        this.ray2 = this.curve2!.getStartRay();
        const distance: number = vec3.distance(this.ray1.getOrigin(), this.ray2.getOrigin());
        this.p1 = this.ray1.at(distance / 3);
        this.p2 = this.ray2.at(distance / 3);
        this.generateCurve();
        break;
      case BlendCurvesCommandMode.Menu:
        break;
      case BlendCurvesCommandMode.AdjustEnd1:
        this.p1 = this.ray1!.closestPointToPoint(intersection.point);
        this.generateCurve();
        this.mode = BlendCurvesCommandMode.Menu;
        break;
      case BlendCurvesCommandMode.AdjustEnd2:
        this.p2 = this.ray2!.closestPointToPoint(intersection.point);
        this.generateCurve();
        this.mode = BlendCurvesCommandMode.Menu;
        break;
      default:
        throw new Error("case not implemented");
    }
    this.clicker.reset();
  }

  private generateCurve() {

    this.curve?.delete();

    const controls: Vec4[] = [
      vec4.create(...this.ray1!.getOrigin(), 1),
      vec4.create(...this.p1!, 1),
      vec4.create(...this.p2!, 1),
      vec4.create(...this.ray2!.getOrigin(), 1),
    ];

    this.curve = new Curve(null, controls, 2);
    this.curve.showControls(true);

  }

  handleClick(): void {
    if (this.mode === BlendCurvesCommandMode.SelectCurve1 ||
      this.mode === BlendCurvesCommandMode.SelectCurve2) {
      this.clicker.click(["curve"]);
    } else {
      this.clicker.click();
    }
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    const point: Vec3 | null = this.clicker.getPoint();
    if (point) {
      if (this.mode === BlendCurvesCommandMode.AdjustEnd1) {
        this.p1 = this.ray1!.closestPointToPoint(point);
        this.generateCurve();
      } else if (this.mode === BlendCurvesCommandMode.AdjustEnd2) {
        this.p2 = this.ray2!.closestPointToPoint(point);
        this.generateCurve();

      }
    }
  }

  getInstructions(): string {
    switch (this.mode) {
      case BlendCurvesCommandMode.SelectCurve1:
        return "0:Exit  Select first curve to blend.  $";
      case BlendCurvesCommandMode.SelectCurve2:
        return "0:Exit  Select second curve to blend.  $";
      case BlendCurvesCommandMode.Menu:
        return "0:Exit  1:FlipCurve1  2:FlipCurve2  3:AdjustEnd1  4:AdjustEnd2  $";
      case BlendCurvesCommandMode.AdjustEnd1:
        return "0:Exit  Click to place control point.  $";
      case BlendCurvesCommandMode.AdjustEnd2:
        return "0:Exit  Click to place control point.  $";
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
    if (this.curve) {
      INSTANCE.getScene().addGeometry(this.curve);
      this.curve.showControls(false);
    }
  }

}
