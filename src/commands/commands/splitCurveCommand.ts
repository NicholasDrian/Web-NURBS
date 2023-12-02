import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum SplitCurveCommandMode {
  SelectCurve,
  SelectSplitPoint,
}

export class SplitCurveCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private mode: SplitCurveCommandMode;
  private showSuggestions: boolean;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.mode = SplitCurveCommandMode.SelectCurve;
    this.showSuggestions = false;
    INSTANCE.getSelector().reset();
  }

  handleInputString(input: string): void {
    if (input == "0") {
      this.done();
    }
  }

  handleClickResult(intersection: Intersection): void {
    throw new Error("Method not implemented.");
  }

  handleClick(): void {
    throw new Error("Method not implemented.");
  }

  handleMouseMove(): void {
    throw new Error("Method not implemented.");
  }

  getInstructions(): string {
    switch (this.mode) {
      case SplitCurveCommandMode.SelectCurve:
        return "0:Exit  Select curve to split.  $";
      case SplitCurveCommandMode.SelectSplitPoint:
        if (this.showSuggestions) {
          return "0:Exit  1:HideSuggestions  Select split point.  $";
        } else {
          return "0:Exit  1:ShowSuggestions  Select split point.  $";
        }
      default:
        throw new Error("case not implemented");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
  }

}
