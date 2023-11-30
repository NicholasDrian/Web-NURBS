import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum ArcCommandMode {
  Menu,
  FromStartEndMiddle,
  FromCenterStartEnd,
}

export class ArcCommand extends Command {

  private finished: boolean;
  private mode: ArcCommandMode;
  private curve: Curve | null;
  private clicker: Clicker;
  private p1: Vec3 | null;
  private p2: Vec3 | null;

  constructor() {
    super();
    this.finished = false;
    this.mode = ArcCommandMode.Menu;
    this.p1 = null;
    this.p2 = null;
    this.clicker = new Clicker();
    this.curve = null;
  }

  public override handleInputString(input: string): void {
    if (input == "0") {
      this.finished = true;
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
  }

  public override handleClickResult(input: Intersection): void {
    switch (this.mode) {
      case ArcCommandMode.Menu:
        break;
      case ArcCommandMode.FromStartEndMiddle:
        this.handleClickStartEndMiddle();
        break;
      case ArcCommandMode.FromCenterStartEnd:
        this.handleClickCenterStartEnd();
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
        this.handleMouseMoveCenterStartEnd();
        break;
      case ArcCommandMode.FromStartEndMiddle:
        this.handleMouseMoveStartEndMiddle();
        break;
    }
  }
  public override getInstructions(): string {
    switch (this.mode) {
      case ArcCommandMode.Menu:
        return "0:Exit  1:StartEndMiddle  2:CenterStartEnd  3:CenterStartPlaneAngle  $";
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


  public handleClickStartEndMiddle(): void {
    if (this.p1 === null) {

    } else if (this.p2 === null) {

    } else {

    }
  }
  public handleClickCenterStartEnd(): void {

  }

  public handleMouseMoveStartEndMiddle(): void {
    if (this.p1 && this.p2) {

    }
  }

  public handleMouseMoveCenterStartEnd(): void {
    if (this.p1 && this.p2) {

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
    }
  }

}








