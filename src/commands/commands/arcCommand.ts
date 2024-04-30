import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { createArc } from "../../geometry/nurbs/arc";
import { Curve } from "../../geometry/nurbs/curve";
import { Plane } from "../../geometry/plane";
import { Ray } from "../../geometry/ray";
import { angleBetween } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum ArcCommandMode {
  Menu,
  FromStartEndMiddle,
  FromCenterStartEnd,
}

export class ArcCommand extends Command {

  private finished: boolean;
  private flipped: boolean;
  private mode: ArcCommandMode;
  private curve: Curve | null;
  private clicker: Clicker;
  private p1: Vec3 | null;
  private p2: Vec3 | null;

  constructor() {
    super();
    this.finished = false;
    this.flipped = false;
    this.mode = ArcCommandMode.Menu;
    this.p1 = null;
    this.p2 = null;
    this.clicker = new Clicker();
    this.curve = null;
  }

  public override handleInputString(input: string): void {
    if (input == "0") {
      this.curve?.delete();
      this.finished = true;
      this.clicker.destroy();
      return;
    }
    if (this.mode == ArcCommandMode.Menu) {
      switch (input) {
        case "1":
          this.mode = ArcCommandMode.FromStartEndMiddle;
          break;
        case "2":
          this.mode = ArcCommandMode.FromCenterStartEnd;
          break;
      }
    }
    if (this.mode == ArcCommandMode.FromCenterStartEnd) {
      if (this.p1 && this.p2 && input == "1") {
        this.flipped = !this.flipped;
        this.handleMouseMove();
      }
    }
  }

  public override handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case ArcCommandMode.Menu:
        break;
      case ArcCommandMode.FromStartEndMiddle:
        this.handleClickStartEndMiddle(intersection);
        break;
      case ArcCommandMode.FromCenterStartEnd:
        this.handleClickCenterStartEnd(intersection);
        break;
      default:
        throw new Error("case not handled");
    }
    this.clicker.reset();
  }

  public override handleClick(): void {
    this.clicker.click();
  }

  public override handleMouseMove(): void {
    this.clicker.onMouseMove();
    switch (this.mode) {
      case ArcCommandMode.FromCenterStartEnd:
        this.handleMouseMoveCenterStartEnd(null);
        break;
      case ArcCommandMode.FromStartEndMiddle:
        this.handleMouseMoveStartEndMiddle(null);
        break;
    }
  }
  public override getInstructions(): string {
    switch (this.mode) {
      case ArcCommandMode.Menu:
        return "0:Exit  1:StartEndMiddle  2:CenterStartEnd  $";
      case ArcCommandMode.FromStartEndMiddle:
        return this.getInstructionsStartEndMiddle();
      case ArcCommandMode.FromCenterStartEnd:
        return this.getInstructionsCenterStartEnd();
      default:
        throw new Error("case not handled");
    }
  }

  public getInstructionsStartEndMiddle(): string {
    if (this.p1 === null) {
      return "0:Exit  Click start point.  $";
    }
    if (this.p2 === null) {
      return "0:Exit  Click end point.  $";
    }
    return "0:Exit  click middle point.  $"
  }

  public getInstructionsCenterStartEnd(): string {
    if (this.p1 === null) {
      return "0: Exit  click center point.  $";
    }
    if (this.p2 === null) {
      return "0: Exit  click start point.  $";
    }
    return "0: Exit  1:Flip  click end point.  $";
  }


  public handleClickStartEndMiddle(intersection: Intersection): void {
    if (this.p1 === null) {
      this.p1 = intersection.point;
    } else if (this.p2 === null && !vec3.equals(this.p1, intersection.point)) {
      this.p2 = intersection.point;
    } else {
      this.handleMouseMoveStartEndMiddle(intersection.point);
      this.done();
    }
  }
  public handleClickCenterStartEnd(intersection: Intersection): void {
    if (this.p1 === null) {
      this.p1 = intersection.point;
    } else if (this.p2 === null && !vec3.equals(this.p1, intersection.point)) {
      this.p2 = intersection.point;
    } else {
      this.handleMouseMoveCenterStartEnd(intersection.point);
      this.done();
    }
  }

  public handleMouseMoveStartEndMiddle(point: Vec3 | null): void {
    if (this.p1 && this.p2) {
      if (!point) point = this.clicker.getPoint();
      if (point) {
        const ab: Vec3 = vec3.sub(this.p1, point);
        const ac: Vec3 = vec3.sub(this.p2, point);
        const normal: Vec3 = vec3.normalize(vec3.cross(ab, ac));

        const ro: Vec3 = vec3.scale(vec3.add(point, this.p1), 0.5);
        const rd: Vec3 = vec3.normalize(vec3.cross(ab, normal));
        const r: Ray = new Ray(ro, rd);

        const po: Vec3 = vec3.scale(vec3.add(point, this.p2), 0.5);
        const pn: Vec3 = vec3.normalize(ac);
        const p: Plane = new Plane(po, pn);

        const t: number = r.intersectPlane(p, true)!;
        const center: Vec3 = r.at(t);
        const radius: number = vec3.distance(point, center);

        const xAxis: Vec3 = vec3.normalize(vec3.sub(this.p2, center));
        const yAxis: Vec3 = vec3.cross(normal, xAxis);

        var theta: number = angleBetween(vec3.sub(this.p1, center), vec3.sub(this.p2, center));

        if (angleBetween(ab, ac) < Math.PI / 2) {
          theta = 2 * Math.PI - theta;
        }

        if (isNaN(theta) || theta === 0) return;

        this.curve?.delete();
        this.curve = createArc(center, xAxis, yAxis, radius, 0, theta);
      }
    }
  }

  public handleMouseMoveCenterStartEnd(point: Vec3 | null): void {
    if (this.p1 && this.p2) {
      if (!point) point = this.clicker.getPoint();
      if (point) {
        const xAxis: Vec3 = vec3.normalize(vec3.sub(this.p2, this.p1));
        const toEnd: Vec3 = vec3.sub(point, this.p1);
        const normal: Vec3 = vec3.normalize(vec3.cross(xAxis, toEnd));
        const yAxis: Vec3 = vec3.cross(normal, xAxis);
        const radius: number = vec3.length(toEnd);
        var theta: number = angleBetween(xAxis, toEnd);

        if (this.flipped) {
          theta = Math.PI * 2 - theta;
          vec3.scale(yAxis, -1, yAxis);
        }

        if (isNaN(theta) || theta === 0) return;

        this.curve?.delete();
        this.curve = createArc(this.p1, xAxis, yAxis, radius, 0, theta);
      }
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    if (this.curve && this.finished) {
      INSTANCE.getScene().addGeometry(this.curve);
    }
  }

}








