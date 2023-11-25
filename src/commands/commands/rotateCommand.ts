import { Mat4, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Ray } from "../../geometry/ray";
import { Clicker } from "../clicker";
import { Command } from "../command";


enum RotateCommandMode {
  SelectCenterPoint,
  SelectAxisPoint,
  SelectFromPointOrAngle,
  SelectToPoint,
}

export class RotateCommand extends Command {

  private mode: RotateCommandMode;
  private clicker: Clicker;
  private center: Vec3 | null;
  private axis: Ray | null;
  private fromPoint: Vec3 | null;
  private finished: boolean;
  private geometry: Map<Geometry, Mat4>;

  constructor() {
    super();
    this.mode = RotateCommandMode.SelectCenterPoint;
    this.clicker = new Clicker();
    this.center = null;
    this.axis = null;
    this.fromPoint = null;
    this.finished = false;
    this.geometry = new Map<Geometry, Mat4>;

    const selected: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selected.size === 0) {
      this.done();
      return;
    }

    for (const geo of selected) {
      this.geometry.set(geo, geo.getModel());
    }

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
      case RotateCommandMode.SelectCenterPoint:
        return "0:Exit  Click center point.  $";
      default:
        throw new Error("case not implemented");
    }
  }
  isFinished(): boolean {
    throw new Error("Method not implemented.");
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
  }

}
