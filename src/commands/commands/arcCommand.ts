import { Intersection } from "../../geometry/intersection";
import { Command } from "../command";

enum ArcCommandMode {
  Menu,
  From3Points,
  FromCenterPointPoint,
}

export class ArcCommand extends Command {

  private finished: boolean;
  private mode: ArcCommandMode;

  constructor() {
    super();
    this.finished = false;
    this.mode = ArcCommandMode.Menu;
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
    switch (this.mode) {
      case ArcCommandMode.Menu:
        return "0:Exit  1:From3Points  2:FromCenterPointPoint  $";
      default:
        throw new Error("case not handled");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

}
