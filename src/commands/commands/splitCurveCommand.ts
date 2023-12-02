import { Intersection } from "../../geometry/intersection";
import { Command } from "../command";

export class SplitCurveCommand extends Command {

  handleInputString(input: string): void {
    throw new Error("Method not implemented.");
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
    throw new Error("Method not implemented.");
  }
  isFinished(): boolean {
    throw new Error("Method not implemented.");
  }

}
