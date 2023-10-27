import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { PolyLine } from "../../geometry/polyLine";
import { Command } from "../command";
import { Clicker } from "../clicker";

export class PolyLineCommand extends Command {

  private polyline: PolyLine | null;
  private finished: boolean;
  private clicker: Clicker;

  constructor() {
    super();
    this.polyline = null;
    this.finished = false;
    this.clicker = new Clicker();
  }

  public override handleInput(input: string): void {
    switch (input) {
      case "0":
        if (this.polyline) this.polyline.delete();
        this.clicker.destroy();
        this.finished = true;
      case "":
        if (this.polyline) {
          if (this.polyline.getSegmentCount() < 2) this.polyline.delete();
          else {
            this.polyline.removeLastPoint();
            INSTANCE.getScene().addGeometry(this.polyline);
          }
        }
        this.clicker.destroy();
        this.finished = true;
        break;
    }
  }

  public override handleClick(): void {
    if (this.clicker.getPoint) {
      const point: Vec3 = this.clicker.getPoint()!;
      if (this.polyline) {
        this.polyline.updateLastPoint(point);
        this.polyline.addPoint(point);
      } else {
        this.polyline = new PolyLine([point, point], [1, 0, 0, 1]);
      }
    }
  }

  public override handleMouseMove(): void {
    if (this.polyline && this.clicker.getPoint()) {
      this.polyline.updateLastPoint(this.clicker.getPoint()!);
    }
  }

  public override getInstructions(): string {
    if (this.polyline) {
      return "Exit:0  click or type next point  $";
    } else {
      return "Exit:0  click or type start point  $";
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }


}
