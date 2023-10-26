import { WINDOW_NAMES } from "../../window/windowManager";
import { Command } from "../command";

enum WindowCommandMode {
  SelectWindow,
  PlaceWindowStart,
  PlaceWindowEnd,
}

export class WindowCommand extends Command {

  private finished: boolean;
  private mode: WindowCommandMode;

  constructor() {
    super();
    this.finished = false;
    this.mode = WindowCommandMode.SelectWindow;
  }

  public handleInput(input: string): void {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        if (input == "0") this.finished = true;
        break;
      case WindowCommandMode.PlaceWindowStart:
        break;
      case WindowCommandMode.PlaceWindowEnd:
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public handleClick(x: number, y: number): void {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        break;
      case WindowCommandMode.PlaceWindowStart:
        break;
      case WindowCommandMode.PlaceWindowEnd:
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public handleMouseMove(x: number, y: number): void {

    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        break;
      case WindowCommandMode.PlaceWindowStart:
        break;
      case WindowCommandMode.PlaceWindowEnd:
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public getInstructions(): string {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        var res: string = "Exit:0  ";
        for (let i = 0; i < WINDOW_NAMES.length; i++) {
          res += WINDOW_NAMES[i] + "(" + (i + 1).toString() + ")  ";
        }
        return res + "$";
      case WindowCommandMode.PlaceWindowStart:
        return "";
      case WindowCommandMode.PlaceWindowEnd:
        return "";
      default:
        throw new Error("Not implemented");
    }
  }

  public isFinished(): boolean {
    return this.finished;
  }

}
