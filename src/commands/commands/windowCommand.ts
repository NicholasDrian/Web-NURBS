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
        return "";
        break;
      case WindowCommandMode.PlaceWindowStart:
        return "";
        break;
      case WindowCommandMode.PlaceWindowEnd:
        return "";
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public isFinished(): boolean {
    return this.finished;
  }

}