import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Line } from "../../geometry/line";
import { Command } from "../command";
import { Clicker } from "../clicker";


export class LineCommand extends Command {

  private finished: boolean;
  private line: Line | null;
  private clicker: Clicker;

  constructor() {
    super();
    this.finished = false;
    this.line = null;
    this.clicker = new Clicker();
  }

  public override handleInput(input: string): void {
    switch (input) {
      case "0": case "":
        if (this.line) this.line.delete();
        this.clicker.destroy();
        this.finished = true;
        break;
    }

    // TODO: 
  }

  public override handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.line && this.clicker.getPoint()) {
      this.line.updateEnd(this.clicker.getPoint()!);
    }
  }

  public override handleClick(): void {
    const point: Vec3 | null = this.clicker.getPoint();
    if (point) {
      if (this.line) {
        this.line.updateEnd(point);
        INSTANCE.getScene().addGeometry(this.line);
        this.clicker.destroy();
        this.finished = true;
      } else {
        this.line = new Line(point, point, [1, 0, 0, 1]);
      }
    }
  }

  public override getInstructions(): string {
    if (this.line) {
      return "Exit:0  Click or type end point.  $";
    } else {
      return "Exit:0  Click or type start point.  $";
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }


}
