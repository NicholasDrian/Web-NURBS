import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Command } from "../command";

export class SetMaterialCommand extends Command {

  private finished: boolean;

  constructor() {
    super();
    this.finished = false;
    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
    }
  }

  handleInputString(input: string): void {
    if (input == "0") this.done();
    else {
      const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
      for (const geo of selection) geo.setMaterial(input);
      this.done();
    }
  }

  handleClickResult(intersection: Intersection): void {
  }

  handleClick(): void {
  }

  handleMouseMove(): void {
  }

  getInstructions(): string {
    return "0:Exit  Enter material name.  $";
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done() {
    this.finished = true;
  }

}
