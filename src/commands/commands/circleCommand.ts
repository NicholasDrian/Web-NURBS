import { Command } from "../command";

export class CircleCommand extends Command {

  private finished: boolean;

  constructor() {
    super();
    this.finished = false;
  }

  public override handleInput(input: string): void {

  }
  public override handleClick(): void {

  }
  public override handleMouseMove(): void {

  }
  public override getInstructions(): string {
    return "";
  }
  public override isFinished(): boolean {
    return this.finished;
  }


}
