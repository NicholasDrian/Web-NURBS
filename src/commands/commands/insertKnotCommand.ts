import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { Clicker } from "../clicker";
import { Command } from "../command";

export class InsertKnotCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private curve: Curve | null;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.curve = null;
    INSTANCE.getSelector().reset();
  }

  handleInputString(input: string): void {
    if (input == "0") {
      this.done();
      return;
    }
    if (this.curve) {
      const time: number = parseFloat(input);
      if (!isNaN(time)) {
        this.curve.insertKnot(time);
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    this.curve?.unSelect();
    this.curve = <Curve>intersection.geometry;
    this.curve.select();
    this.clicker.reset();
  }

  handleClick(): void {
    this.clicker.click(["curve"]);
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove(["curve"]);
  }

  getInstructions(): string {
    return "0:Exit  Click curve then enter time for knot insertion.  $";
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
  }

}
