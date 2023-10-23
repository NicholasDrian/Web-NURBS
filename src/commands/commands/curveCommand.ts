import { Curve } from "../../geometry/nurbs/curve";
import { Command } from "../command";


enum CurveCommandMode {
  AddPoints,
  ChangeDegree,
}

export class CurveCommand extends Command {

  private finished: boolean;
  private degree: number;
  private curve: Curve | null;
  private mode: CurveCommandMode;

  constructor() {
    super();
    this.finished = false;
    this.curve = null;
    this.degree = 2;
    this.mode = CurveCommandMode.AddPoints;
  }

  public handleInput(input: string): void {

  }

  public handleClick(x: number, y: number): void {

  }

  public handleMouseMove(x: number, y: number): void {

  }

  public getInstructions(): string {
    switch (this.mode) {
      case CurveCommandMode.AddPoints:
        if (this.curve == null) return `Exit:0  Degree(${this.degree}):1  Click start point.  $`;
        else return `Exit:0  Degree(${this.degree}):1  Click next point.  $`;
      case CurveCommandMode.ChangeDegree:
        return `Exit:0  Enter New Degree(${this.degree})  $`;
      default:
        return "";
    }
  }

  public isFinished(): boolean {
    return this.finished;
  }


}
