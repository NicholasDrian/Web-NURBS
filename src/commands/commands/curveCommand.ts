import { Vec3, vec4 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Curve } from "../../geometry/nurbs/curve";
import { Ray } from "../../geometry/ray";
import { Command } from "../command";
import { Clicker } from "../clicker";


enum CurveCommandMode {
  AddPoints,
  ChangeDegree,
}

export class CurveCommand extends Command {

  private finished: boolean;
  private degree: number;
  private curve: Curve | null;
  private mode: CurveCommandMode;
  private clicker: Clicker;

  constructor() {
    super();
    this.finished = false;
    this.curve = null;
    this.degree = 2;
    this.mode = CurveCommandMode.AddPoints;
    this.clicker = new Clicker();
  }

  public override handleInput(input: string): void {
    if (this.mode === CurveCommandMode.AddPoints) {
      switch (input) {
        case "0":
          this.curve?.destroy();
          this.finished = true;
          this.clicker.destroy();
          break;
        case "1":
          this.mode = CurveCommandMode.ChangeDegree;
          break;
        case "":
          if (this.curve != null) {
            if (this.curve.getControlPointCount() < 3) this.curve.destroy();
            else {
              this.curve.removeLastControlPoint();
              INSTANCE.getScene().addGeometry(this.curve);
            }
          }
          this.finished = true;
          this.clicker.destroy();
          break;
      }
    } else if (this.mode === CurveCommandMode.ChangeDegree) {
      switch (input) {
        case "0": case "":
          break;
        default:
          const degree: number | undefined = parseInt(input);
          if (degree) {
            this.degree = degree;
            this.curve?.elevateDegree(Math.min(this.curve.getControlPointCount() - 1, this.degree));
          }
          break;
      }
      this.mode = CurveCommandMode.AddPoints;
    }
  }

  public override handleClick(): void {
    if (this.clicker.getPoint()) {
      const point: Vec3 = this.clicker.getPoint()!;
      if (this.curve) {
        this.curve.updateLastControlPoint(point, 1);
        this.curve.addControlPoint(point, 1);
        if (this.curve.getDegree() < this.degree) this.curve.elevateDegree(1);
      } else {
        this.curve = new Curve(
          null,
          [vec4.create(...point, 1), vec4.create(...point, 1)],
          1
        )
      }
    }
  }

  public override handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.curve && this.clicker.getPoint()) {
      this.curve.updateLastControlPoint(this.clicker.getPoint()!, 1);
    }
  }

  public override getInstructions(): string {
    switch (this.mode) {
      case CurveCommandMode.AddPoints:
        if (this.curve == null)
          return `Exit:0  Degree(${this.degree}):1  Click start point.  $`;
        return `Exit:0  Degree(${this.degree}):1  Click next point.  $`;
      case CurveCommandMode.ChangeDegree:
        return `Exit:0  Enter New Degree(${this.degree})  $`;
      default:
        return "";
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }


}
