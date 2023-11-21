import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { revolve } from "../../geometry/nurbs/revolve";
import { Surface } from "../../geometry/nurbs/surface";
import { Ray } from "../../geometry/ray";
import { ObjectID } from "../../scene/scene";
import { angleBetween } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum RevolveCommandMode {
  SelectCurves,
  FirstAxisPoint,
  SecondAxisPoint,
  FirstAnglePoint,
  SecondAnglePoint,
}

export class RevolveCommand extends Command {

  private finished: boolean;
  private mode: RevolveCommandMode;
  private clicker: Clicker;
  private curves: Curve[];
  private temp: Vec3 | null;
  private axis: Ray | null;
  private flipped: boolean;
  private surfaces: Surface[];

  constructor() {
    super();
    this.finished = false;
    this.flipped = false;
    this.mode = RevolveCommandMode.SelectCurves;
    this.clicker = new Clicker();
    this.curves = [];
    this.temp = null;
    this.axis = null;
    this.surfaces = [];
    INSTANCE.getSelector().reset();
  }

  public override handleInputString(input: string): void {
    if (input == "0") {
      this.done();
    }
    switch (this.mode) {
      case RevolveCommandMode.SelectCurves:
        if (input == "") {
          if (this.curves.length == 0) this.done();
          else this.mode = RevolveCommandMode.FirstAxisPoint;
        }
        break;
      case RevolveCommandMode.FirstAxisPoint:
        break;
      case RevolveCommandMode.SecondAxisPoint:
        break;
      case RevolveCommandMode.FirstAnglePoint:
        if (input == "1") {
          this.fullRevolution();
        }
        break;
      case RevolveCommandMode.SecondAnglePoint:
        if (input == "1") {
          this.fullRevolution();
        }
        if (input == "2") {
          this.flip();
        }
        break;
      default:
        throw new Error("case not handled");
    }
  }

  public override handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case RevolveCommandMode.SelectCurves:
        var geometry: Geometry = INSTANCE.getScene().getGeometry(intersection.object);
        while (geometry.getTypeName() != "Curve" && geometry.getParent()) {
          geometry = geometry.getParent()!;
        }
        if (geometry.getTypeName() == "Curve") {
          this.curves.push(<Curve>geometry);
          geometry.select();
        }
        break;
      case RevolveCommandMode.FirstAxisPoint:
        this.temp = intersection.point;
        this.mode = RevolveCommandMode.SecondAxisPoint;
        break;
      case RevolveCommandMode.SecondAxisPoint:
        if (vec3.equals(this.temp!, intersection.point)) break;
        this.axis = new Ray(this.temp!, vec3.sub(this.temp!, intersection.point));
        this.mode = RevolveCommandMode.FirstAnglePoint;
        break;
      case RevolveCommandMode.FirstAnglePoint:
        this.temp = intersection.point;
        this.mode = RevolveCommandMode.SecondAnglePoint;
        break;
      case RevolveCommandMode.SecondAnglePoint:
        if (vec3.equals(this.temp!, intersection.point)) break;
        for (const surface of this.surfaces) surface.delete();

        const origin1: Vec3 = this.axis!.closestPointToPoint(this.temp!);
        const origin2: Vec3 = this.axis!.closestPointToPoint(intersection.point);
        const v1 = vec3.sub(this.temp!, origin1);
        const v2 = vec3.sub(intersection.point, origin2);
        var theta: number = angleBetween(v1, v2);

        if (vec3.dot(v2, vec3.cross(v1, this.axis!.getDirection())) > 0) {
          theta = 2 * Math.PI - theta;
        }

        if (theta == 0 || isNaN(theta)) return;

        if (this.flipped) theta = Math.PI * 2 - theta;

        for (const curve of this.curves) {
          const revolution: Surface = revolve(this.axis!, curve, theta);
          if (this.flipped) {
            var model: Mat4 = revolution.getModel();
            const translation: Vec3 = this.axis!.getOrigin();
            model = mat4.translate(model, vec3.scale(translation, -1));
            model = mat4.axisRotate(model, this.axis!.getDirection(), Math.PI * 2 - theta);
            model = mat4.translate(model, translation);
            revolution.setModel(model);
          }
          INSTANCE.getScene().addGeometry(revolution);
        }

        this.done();
        break;
      default:
        throw new Error("case not handled");
    }
    this.clicker.reset();
  }

  public override handleClick(): void {
    switch (this.mode) {
      case RevolveCommandMode.SelectCurves:
        this.clicker.click(["line"]);
        break;
      default:
        this.clicker.click();
    }
  }

  public override handleMouseMove(): void {
    this.clicker.onMouseMove();
    const point: Vec3 | null = this.clicker.getPoint();
    if (point) {
      if (this.mode == RevolveCommandMode.SecondAnglePoint) {

        if (vec3.equals(this.temp!, point)) return;

        for (const surface of this.surfaces) surface.delete();
        this.surfaces = [];

        const origin1: Vec3 = this.axis!.closestPointToPoint(this.temp!);
        const origin2: Vec3 = this.axis!.closestPointToPoint(point);
        const v1 = vec3.sub(this.temp!, origin1);
        const v2 = vec3.sub(point, origin2);
        var theta: number = angleBetween(v1, v2);

        if (vec3.dot(v2, vec3.cross(v1, this.axis!.getDirection())) > 0) {
          theta = 2 * Math.PI - theta;
        }

        if (theta == 0 || isNaN(theta)) return;

        if (this.flipped) theta = Math.PI * 2 - theta;

        for (const curve of this.curves) {
          const revolution: Surface = revolve(this.axis!, curve, theta);
          if (this.flipped) {
            var model: Mat4 = revolution.getModel();
            const translation: Vec3 = this.axis!.getOrigin();
            model = mat4.translate(model, vec3.scale(translation, -1));
            model = mat4.axisRotate(model, this.axis!.getDirection(), Math.PI * 2 - theta);
            model = mat4.translate(model, translation);
            revolution.setModel(model);
          }
          this.surfaces.push(revolution);
        }
      }
    }
  }

  public override getInstructions(): string {
    switch (this.mode) {
      case RevolveCommandMode.SelectCurves:
        return "0:Exit  Select curves.  $";
      case RevolveCommandMode.FirstAxisPoint:
        return "0:Exit  Click or type first axis point.  $";
      case RevolveCommandMode.SecondAxisPoint:
        return "0:Exit  Click or type second axis point.  $";
      case RevolveCommandMode.FirstAnglePoint:
        return "0:Exit  1:Full  Click or type first angle point.  $";
      case RevolveCommandMode.SecondAnglePoint:
        return "0:Exit  1:Full  2:Flip  Click or type second angle point.  $";
      default:
        throw new Error("case not handled");
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.clicker.destroy();
    for (const curve of this.curves) {
      curve.unSelect();
    }
    this.finished = true;
  }

  private fullRevolution(): void {
    for (const surface of this.surfaces) {
      surface.delete();
    }
    for (const curve of this.curves) {
      const revolution: Surface = revolve(this.axis!, curve, Math.PI * 2);
      INSTANCE.getScene().addGeometry(revolution);
    }
    this.done();
  }

  private flip(): void {
    this.flipped = !this.flipped;
    this.handleMouseMove();
  }

}
