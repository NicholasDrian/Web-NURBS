import { Vec3 } from "wgpu-matrix";
import { Intersection } from "../../geometry/intersection";
import { Command } from "../command";

enum ArcCommandMode {
  Menu,
  FromStartEndMiddle,
  FromCenterStartEnd,
  FromCenterStartPlaneAngle,
}

export class ArcCommand extends Command {

  private finished: boolean;
  private mode: ArcCommandMode;
  private p1: Vec3 | null;
  private p2: Vec3 | null;

  constructor() {
    super();
    this.finished = false;
    this.mode = ArcCommandMode.Menu;
    this.p1 = null;
    this.p2 = null;
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
        case "3":
          this.mode = ArcCommandMode.FromCenterStartPlaneAngle;
          break;
      }
    }
  }

  public override handleClickResult(input: Intersection): void {
    // TODO: this should take point input?
    throw new Error("Method not implemented.");
  }

  public override handleClick(): void {
    switch (this.mode) {
      case ArcCommandMode.Menu:
        return;
      case ArcCommandMode.FromStartEndMiddle:
        return this.handleClickStartEndMiddle();
      case ArcCommandMode.FromCenterStartEnd:
        return this.handleClickCenterStartEnd();
      case ArcCommandMode.FromCenterStartPlaneAngle:
        return this.handleClickCenterStartPlaneAngle();
      default:
        throw new Error("case not handled");
    }
  }
  public override handleMouseMove(): void {
    throw new Error("Method not implemented.");
  }
  public override getInstructions(): string {
    switch (this.mode) {
      case ArcCommandMode.Menu:
        return "0:Exit  1:StartEndMiddle  2:CenterStartEnd  3:CenterStartPlaneAngle  $";
      case ArcCommandMode.FromStartEndMiddle:
        return this.getInstructionsStartEndMiddle();
      case ArcCommandMode.FromCenterStartEnd:
        return this.getInstructionsCenterStartEnd();
      case ArcCommandMode.FromCenterStartPlaneAngle:
        return this.getInstructionsCenterStartPlaneAngle();
      default:
        throw new Error("case not handled");
    }
  }

  public getInstructionsStartEndMiddle(): string {
    return "";
  }
  public getInstructionsCenterStartEnd(): string {
    return "";
  }
  public getInstructionsCenterStartPlaneAngle(): string {
    return "";
  }


  public handleClickStartEndMiddle(): void {

  }
  public handleClickCenterStartEnd(): void {

  }
  public handleClickCenterStartPlaneAngle(): void {

  }


  public handleMouseMoveStartEndMiddle(): void {

  }
  public handleMouseMoveCenterStartEnd(): void {

  }
  public handleMouseMoveCenterStartPlaneAngle(): void {

  }




  isFinished(): boolean {
    return this.finished;
  }

}








