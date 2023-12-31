import { INSTANCE } from "../cad";
import { Intersection } from "../geometry/intersection";
import { Command } from "./command";
import { ArcCommand } from "./commands/arcCommand";
import { LinearArrayCommand } from "./commands/arrayCommand";
import { BlendCurvesCommand } from "./commands/blendCurvesCommand";
import { CameraCommand } from "./commands/cameraCommand";
import { CircleCommand } from "./commands/circleCommand";
import { ConstructionPlaneCommand } from "./commands/constructionPlaneCommand";
import { CopyCommand } from "./commands/copyCommand";
import { CurveCommand } from "./commands/curveCommand";
import { ExtruedCurveCommand } from "./commands/extrudeCurveCommand";
import { LoftCommand } from "./commands/loftCommand";
import { MirrorCommand } from "./commands/mirrorCommand";
import { MoveCommand } from "./commands/moveCommand";
import { PollarArrayCommand } from "./commands/polarArrayCommand";
import { RevolveCommand } from "./commands/revolveCommand";
import { RotateCommand } from "./commands/rotateCommand";
import { Scale1Command } from "./commands/scale1Command";
import { Scale2Command } from "./commands/scale2Command";
import { ScaleCommand } from "./commands/scaleCommand";
import { SetMaterialCommand } from "./commands/setMaterialCommand";
import { ShearCommand } from "./commands/shearCommand";
import { SnapsCommand } from "./commands/snapsCommand";
import { SphereCommand } from "./commands/sphereCommand";
import { SplitCurveCommand } from "./commands/splitCurveCommand";
import { Sweep2Command } from "./commands/sweep2Command";
import { WindowCommand } from "./commands/windowCommand";
import { hide, hideSwap, show } from "./oneTimeCommands/hideCommands";
import { reverseCurveCommand } from "./oneTimeCommands/reverseCurveCommand";
import { ControlCageOffCommand, ControlCageOnCommand } from "./oneTimeCommands/toggleControlCageCommand";
import { toggleDarkMode } from "./oneTimeCommands/toggleDarkModeCommand";


export class CommandManager {

  private currentCommand: Command | null;
  private previousInput: string;

  constructor() {
    this.currentCommand = null;
    this.previousInput = "null";
  }

  public handleInput(input: string) {

    INSTANCE.getLog().log(input);

    input = input.toLowerCase();

    if (this.currentCommand) this.currentCommand.handleInputString(input);
    else {
      switch (input) {
        case "":
          this.handleInput(this.previousInput);
          return;
        case "darkmode": case "dm":
          toggleDarkMode();
          break;
        case "constructionplane": case "cpl":
          this.currentCommand = new ConstructionPlaneCommand();
          break;
        case "camera": case "cam":
          this.currentCommand = new CameraCommand();
          break;
        case "curve": case "c":
          this.currentCommand = new CurveCommand();
          break;
        case "window": case "w":
          this.currentCommand = new WindowCommand();
          break;
        case "snaps": case "sn":
          this.currentCommand = new SnapsCommand();
          break;
        case "circle": case "ci":
          this.currentCommand = new CircleCommand();
          break;
        case "arc": case "a":
          this.currentCommand = new ArcCommand();
          break;
        case "loft": case "l":
          this.currentCommand = new LoftCommand();
          break;
        case "revolve": case "re":
          this.currentCommand = new RevolveCommand();
          break;
        case "copy": case "cp":
          this.currentCommand = new CopyCommand();
          break;
        case "move": case "m":
          this.currentCommand = new MoveCommand();
          break;
        case "scale1": case "s1":
          this.currentCommand = new Scale1Command();
          break;
        case "scale2": case "s2":
          this.currentCommand = new Scale2Command();
          break;
        case "scale": case "s":
          this.currentCommand = new ScaleCommand();
          break;
        case "shear": case "sh":
          this.currentCommand = new ShearCommand();
          break;
        case "polar array": case "pa":
          this.currentCommand = new PollarArrayCommand();
          break;
        case "linear array": case "la":
          this.currentCommand = new LinearArrayCommand();
          break;
        case "mirror": case "mi":
          this.currentCommand = new MirrorCommand();
          break;
        case "rotate": case "r":
          this.currentCommand = new RotateCommand();
          break;
        case "show controls": case "sc":
          ControlCageOnCommand();
          break;
        case "hidw controls": case "hc":
          ControlCageOffCommand();
          break;
        case "sphere": case "sp":
          this.currentCommand = new SphereCommand();
          break;
        case "set material": case "sm":
          this.currentCommand = new SetMaterialCommand();
          break;
        case "show": case "sh":
          show();
          break;
        case "hide": case "h":
          hide();
          break;
        case "hide swap": case "hs":
          hideSwap();
          break;
        case "blend curves": case "bc":
          this.currentCommand = new BlendCurvesCommand();
          break;
        case "extrude curve": case "e":
          this.currentCommand = new ExtruedCurveCommand();
          break;
        case "sweep2": case "sw2":
          this.currentCommand = new Sweep2Command();
          break;
        case "reverse curve": case "rc":
          reverseCurveCommand();
          break;
        case "split curve": case "spc":
          this.currentCommand = new SplitCurveCommand();
          break;
        default: INSTANCE.getLog().log("Invalid Command");
      }
      this.previousInput = input;
    }

    if (this.currentCommand?.isFinished()) {
      this.currentCommand = null;
    }

  }

  hasActiveCommand(): boolean {
    return this.currentCommand != null;
  }

  public handleClickInput(): void {
    this.currentCommand?.handleClick();
    if (this.currentCommand?.isFinished()) {
      this.currentCommand = null;
    }
  }

  public handleClickResult(intersection: Intersection): void {
    this.currentCommand?.handleClickResult(intersection);
    if (this.currentCommand?.isFinished()) {
      this.currentCommand = null;
    } INSTANCE.getCli().render();
  }

  public handleMouseMove(): void {
    this.currentCommand?.handleMouseMove();
  }

  public getInstructions(): string {
    if (this.currentCommand) return this.currentCommand!.getInstructions();
    return "$";
  }

}
