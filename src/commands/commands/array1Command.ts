

import { Intersection } from "../../geometry/intersection";
import { Clicker } from "../clicker";
import { Command } from "../command";

export class Array1Command extends Command {

  private finished: boolean;
  private clicker: Clicker;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
  }

  handleInputString(input: string): void {
    throw new Error("Method not implemented.");
  }
  handleClickResult(input: Intersection): void {
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
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
  }

}
