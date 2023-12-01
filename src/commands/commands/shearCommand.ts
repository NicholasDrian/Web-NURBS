import { Intersection } from "../../geometry/intersection";
import { Command } from "../command";

export class ShearCommand extends Command {

  private finished: boolean;


  constructor() {
    super();
    this.finished = false;
  }

  handleInputString(input: string): void {
    alert("todo shear");
    this.finished = true;
  }

  handleClickResult(input: Intersection): void {
    alert("todo shear");
  }

  handleClick(): void {
    alert("todo shear");
  }

  handleMouseMove(): void {
    alert("todo shear");

  }

  getInstructions(): string {
    alert("todo shear");
    return "";
  }

  isFinished(): boolean {
    return this.finished;
  }

}
