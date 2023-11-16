import { warn } from "console";
import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { createCircleCenterNormalRadius, createCircleThreePoints } from "../../geometry/nurbs/circle";
import { Curve } from "../../geometry/nurbs/curve";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum CircleCommandMode {
  Menu,
  ThreePoints,
  CenterNormalRadius,
  CenterPointPoint
}

export class CircleCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private mode: CircleCommandMode;

  private v1: Vec3 | null;
  private v2: Vec3 | null;
  private v3: Vec3 | null;
  private curve: Curve | null;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.mode = CircleCommandMode.Menu;
    this.v1 = null;
    this.v2 = null;
    this.v3 = null;
    this.curve = null;
  }

  public override handleInputString(input: string): void {
    if (input === "0") {
      this.done();
      return;
    }
    switch (this.mode) {
      case CircleCommandMode.Menu:
        if (input === "1") this.mode = CircleCommandMode.ThreePoints;
        if (input === "2") this.mode = CircleCommandMode.CenterNormalRadius;
        if (input === "3") this.mode = CircleCommandMode.CenterPointPoint;
        break;
      case CircleCommandMode.CenterNormalRadius:
        if (this.v3) {
          const radius: number = parseFloat(input);
          if (!isNaN(radius)) {
            const normal: Vec3 = vec3.normalize(vec3.sub(this.v2!, this.v3));
            if (this.curve) this.curve.destroy();
            this.curve = createCircleCenterNormalRadius(this.v1!, normal, radius);
            this.done();
          }
        }
        break;
    }
  }
  public override handleClickResult(input: Intersection): void {
    throw new Error();
  }


  public override handleClick(): void {
    if (this.clicker.getPoint()) {
      switch (this.mode) {
        case CircleCommandMode.CenterPointPoint:
          this.handleClickCenterPointPoint(this.clicker.getPoint()!);
          break;
        case CircleCommandMode.ThreePoints:
          this.handleClickThreePoints(this.clicker.getPoint()!);
          break;
        case CircleCommandMode.CenterNormalRadius:
          this.handleClickCenterNormalRadius(this.clicker.getPoint()!);
          break;
      }
    }
  }

  public override handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.clicker.getPoint()) {
      switch (this.mode) {
        case CircleCommandMode.CenterPointPoint:
          this.handleMouseMoveCenterPointPoint(this.clicker.getPoint()!);
          break;
        case CircleCommandMode.ThreePoints:
          this.handleMouseMoveThreePoints(this.clicker.getPoint()!);
          break;
        case CircleCommandMode.CenterNormalRadius:
          this.handleMouseMoveCenterNormalRadius(this.clicker.getPoint()!);
          break;
      }
    }
  }

  public override getInstructions(): string {
    switch (this.mode) {
      case CircleCommandMode.Menu:
        return "0:Exit  1:FromThreePoints  2:FromNormalCenterRadius 3:CenterPointPoint $";
      case CircleCommandMode.ThreePoints:
        return this.getInstructionsThreePoints();
      case CircleCommandMode.CenterPointPoint:
        return this.getInstructionsCenterPointPoint();
      case CircleCommandMode.CenterNormalRadius:
        return this.getInstructionsCenterNormalRadius();
      default:
        throw new Error("unhandled switch enum");
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }

  private handleClickCenterPointPoint(point: Vec3): void {
    if (!this.v1) {
      this.v1 = point;
    } else if (!this.v2) {
      if (!vec3.equals(this.v1, point)) this.v2 = point;
    } else if (!this.v3) {
      if (!vec3.equals(this.v1, point) && !vec3.equals(this.v2, point)) {
        const normal: Vec3 = vec3.normalize(
          vec3.cross(
            vec3.sub(this.v1, this.v2),
            vec3.sub(this.v1, point)
          )
        );
        const radius: number = vec3.distance(this.v1, this.v2);
        this.curve = createCircleCenterNormalRadius(this.v1, normal, radius);
        this.done();
      }
    }
  }

  private handleMouseMoveCenterPointPoint(point: Vec3): void {
    if (this.v2) {
      if (!vec3.equals(this.v1!, point) && !vec3.equals(this.v2, point)) {
        const normal: Vec3 = vec3.normalize(
          vec3.cross(
            vec3.sub(this.v1!, this.v2),
            vec3.sub(this.v1!, point)
          )
        );
        const radius: number = vec3.distance(this.v1!, this.v2);
        if (this.curve) this.curve.destroy();
        this.curve = createCircleCenterNormalRadius(this.v1!, normal, radius);
      }
    }
  }

  private getInstructionsCenterPointPoint(): string {
    if (!this.v1) {
      return "0:Exit  Click center point.";
    } else if (!this.v2) {
      return "0:Exit  Click point on circle perimeter.";
    } else {
      return "0:Exit  Click point to establish plane.";
    }
  }

  private handleClickThreePoints(point: Vec3): void {
    if (!this.v1) {
      this.v1 = point;
    } else if (!this.v2) {
      if (!vec3.equals(this.v1, point)) this.v2 = point;
    } else if (!this.v3) {
      if (!vec3.equals(this.v1, point) && !vec3.equals(this.v2, point)) {
        if (this.curve) this.curve.destroy();
        this.curve = createCircleThreePoints(this.v1, this.v2, point);
        this.done();
      }
    }
  }
  private handleMouseMoveThreePoints(point: Vec3): void {
    if (this.v2 && !vec3.equals(this.v2, point) && !vec3.equals(this.v1!, point)) {
      if (this.curve) this.curve.destroy();
      this.curve = createCircleThreePoints(this.v1!, this.v2, point);
    }
  }

  private getInstructionsThreePoints(): string {
    if (this.v1 == null) return "0:Exit Click first point";
    else if (this.v2 == null) return "0:Exit Click second point";
    return "0:Exit Click third point";
  }

  private handleClickCenterNormalRadius(point: Vec3): void {
    if (!this.v1) {
      this.v1 = point;
    } else if (!this.v2) {
      this.v2 = point;
    } else if (!this.v3) {
      if (!vec3.equals(this.v2, point)) {
        this.v3 = point;
      }
    } else {
      if (!vec3.equals(this.v1, point)) {
        const radius: number = vec3.distance(this.v1, point);
        const normal: Vec3 = vec3.normalize(vec3.sub(this.v2, this.v3));
        if (this.curve) this.curve.destroy();
        this.curve = createCircleCenterNormalRadius(this.v1, normal, radius);
        this.done();
      }
    }
  }
  private handleMouseMoveCenterNormalRadius(point: Vec3): void {
    if (this.v3) {
      if (!vec3.equals(this.v1!, point)) {
        const radius: number = vec3.distance(this.v1!, point);
        const normal: Vec3 = vec3.normalize(vec3.sub(this.v2!, this.v3));
        if (this.curve) this.curve.destroy();
        this.curve = createCircleCenterNormalRadius(this.v1!, normal, radius);
      }
    }
  }

  private getInstructionsCenterNormalRadius(): string {
    if (!this.v1) {
      return "0:Exit  Click center point.";
    } else if (!this.v2) {
      return "0:Exit  Click start of normal vector.";
    } else if (!this.v3) {
      return "0:Exit  Click end of normal vector.";
    } else {
      return "0:Exit  Enter radius or click to determine radius.  $";
    }
  }

  private done(): void {
    if (this.curve) {
      INSTANCE.getScene().addGeometry(this.curve);
    }
    this.finished = true;
    this.clicker.destroy();
  }


}
