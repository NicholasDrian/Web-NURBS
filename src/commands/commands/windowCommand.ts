import { INSTANCE } from "../../cad";
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
  private windowName: string = "none";

  constructor() {
    super();
    this.finished = false;
    this.mode = WindowCommandMode.SelectWindow;
  }

  public handleInput(input: string): void {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        if (input == "0") {
          this.finished = true;
          break;
        }
        if (WINDOW_NAMES.has(parseInt(input))) {
          this.windowName = WINDOW_NAMES.get(parseInt(input))!;
          this.mode = WindowCommandMode.PlaceWindowStart;

          // remove existing window to add it back
          INSTANCE.getWindowManager().removeWindow(this.windowName);
        }
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
        INSTANCE.getWindowManager().addWindow(this.windowName, [x, y]);
        this.mode = WindowCommandMode.PlaceWindowEnd;
        break;
      case WindowCommandMode.PlaceWindowEnd:
        INSTANCE.getWindowManager().getWindows().get(this.windowName)!.updateEnd([x, y]);
        this.windowName = "none";
        this.mode = WindowCommandMode.SelectWindow;
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
        INSTANCE.getWindowManager().getWindows().get(this.windowName)!.updateEnd([x, y]);
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public getInstructions(): string {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        var res: string = "Exit:0  ";
        for (let [key, value] of WINDOW_NAMES) {
          res += value + "(" + key.toString() + ")  ";
        }
        return res + "$";
      case WindowCommandMode.PlaceWindowStart:
        return "Exit:0  Click first corner for window.";
      case WindowCommandMode.PlaceWindowEnd:
        return "Exit:0  Click second corner for window.";
      default:
        throw new Error("Not implemented");
    }
  }

  public isFinished(): boolean {
    return this.finished;
  }

}
