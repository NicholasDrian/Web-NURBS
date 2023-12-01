import { Intersection } from "../../geometry/intersection";
import { Clicker } from "../clicker";
import { Command } from "../command";

export class Scale2Command extends Command {

  private finished: boolean;
  private clicker: Clicker;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
  }

  handleInputString(input: string): void {
    alert("todo scale2");
    this.finished = true;
  }
  handleClickResult(input: Intersection): void {
    alert("todo scale2");
  }
  handleClick(): void {
    alert("todo scale2");
  }
  handleMouseMove(): void {
    alert("todo scale2");
  }
  getInstructions(): string {
    alert("todo scale2");
    return "";
  }
  isFinished(): boolean {
    return this.finished;
  }

}
