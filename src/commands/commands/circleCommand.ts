import { warn } from "console";
import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { createCircleThreePoints } from "../../geometry/nurbs/circle";
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

  public override handleInput(input: string): void {
    if (input === "0") {
      this.finished = true;
      return;
    }
    switch (this.mode) {
      case CircleCommandMode.Menu:
        if (input === "1") this.mode = CircleCommandMode.ThreePoints;
        if (input === "2") this.mode = CircleCommandMode.CenterNormalRadius;
        if (input === "3") this.mode = CircleCommandMode.CenterPointPoint;
        break;
    }
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

    } else if (!this.v2) {

    } else if (!this.v3) {

    }
  }

  private handleMouseMoveCenterPointPoint(point: Vec3): void {

  }

  private getInstructionsCenterPointPoint(): string {
    return "";
  }

  private handleClickThreePoints(point: Vec3): void {
    if (!this.v1) {
      this.v1 = point;
    } else if (!this.v2) {
      if (!vec3.equals(this.v1, point)) this.v2 = point;
    } else if (!this.v3) {
      if (!vec3.equals(this.v1, point) && !vec3.equals(this.v2, point)) {
        this.v3 = point;
        this.curve = createCircleThreePoints(this.v1, this.v2, this.v3);
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
    if (this.v1 == null) return "Exit:0 Click first point";
    else if (this.v2 == null) return "Exit:0 Click second point";
    return "Exit:0 Click third point";
  }

  private handleClickCenterNormalRadius(point: Vec3): void {

    if (!this.v1) {

    } else if (!this.v2) {

    } else if (!this.v3) {

    }
  }
  private handleMouseMoveCenterNormalRadius(point: Vec3): void {

  }

  private getInstructionsCenterNormalRadius(): string {
    return "";
  }

  private done(): void {
    INSTANCE.getScene().addGeometry(this.curve!);
    this.finished = true;
    this.clicker.destroy();
  }


}
