import { INSTANCE } from "../cad";
import { Command } from "./command";
import { CameraCommand } from "./commands/cameraCommand";
import { ConstructionPlaneCommand } from "./commands/constructionPlaneCommand";
import { CurveCommand } from "./commands/curveCommand";
import { LineCommand } from "./commands/lineCommand";
import { PolyLineCommand } from "./commands/polylineCommand";
import { SnapsCommand } from "./commands/snapsCommand";
import { WindowCommand } from "./commands/windowCommand";
import { toggleDarkMode } from "./oneTimeCommands/toggleDarkModeCommand";


export class CommandManager {

  private currentCommand: Command | null;
  private previousInput: string;

  constructor() {
    this.currentCommand = null;
    this.previousInput = "";
  }

  public handleInput(input: string) {

    INSTANCE.getLog().log(input);

    input = input.toLowerCase();

    if (this.currentCommand) this.currentCommand.handleInput(input);
    else {
      switch (input) {
        case "":
          this.handleInput(this.previousInput);
          return;
        case "darkmode": case "dm":
          toggleDarkMode();
          break;
        case "constructionplane": case "cp":
          this.currentCommand = new ConstructionPlaneCommand();
          break;
        case "camera": case "cam":
          this.currentCommand = new CameraCommand();
          break;
        case "line": case "ln":
          this.currentCommand = new LineCommand();
          break;
        case "polyline": case "pl":
          this.currentCommand = new PolyLineCommand();
          break;
        case "curve": case "cv":
          this.currentCommand = new CurveCommand();
          break;
        case "window": case "w":
          this.currentCommand = new WindowCommand();
          break;
        case "snaps": case "s":
          this.currentCommand = new SnapsCommand();
          break;
        default: INSTANCE.getLog().log("Invalid Command");
      }
      this.previousInput = input;
    }

    if (this.currentCommand?.isFinished()) {
      this.currentCommand = null;
    }


  }

  public handleClickInput() {
    this.currentCommand?.handleClick();
    if (this.currentCommand?.isFinished()) {
      this.currentCommand = null;
    }
  }

  public handleMouseMove() {
    this.currentCommand?.handleMouseMove();
  }

  public getInstructions(): string {
    if (this.currentCommand) return this.currentCommand!.getInstructions();
    return "$";
  }

}
