import { mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { ObjectID } from "../../scene/scene";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum CopyCommandMode {
  SelectPointToCopyFrom,
  SelectPointToCopyTo,
}

export class CopyCommand extends Command {

  private finished: boolean;
  private mode: CopyCommandMode;
  private pointToCopyFrom: Vec3 | null;
  private clicker: Clicker;
  private objectToCopy: Map<Geometry, Geometry>;

  constructor() {
    super();
    this.finished = false;
    this.mode = CopyCommandMode.SelectPointToCopyFrom;
    this.pointToCopyFrom = null;
    this.clicker = new Clicker();
    this.objectToCopy = new Map<Geometry, Geometry>;

    const selection: Set<ObjectID> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
      return;
    }
    for (const id of selection) {
      this.objectToCopy.set(
        INSTANCE.getScene().getGeometry(id),
        INSTANCE.getScene().getGeometry(id).clone()
      );
    }

  }

  handleInputString(input: string): void {
    switch (this.mode) {
      case CopyCommandMode.SelectPointToCopyFrom:
        break;
      case CopyCommandMode.SelectPointToCopyTo:
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case CopyCommandMode.SelectPointToCopyFrom:
        this.pointToCopyFrom = intersection.point;
        this.mode = CopyCommandMode.SelectPointToCopyTo;
        this.clicker.reset();
        break;
      case CopyCommandMode.SelectPointToCopyTo:
        const translation: Vec3 = vec3.sub(intersection.point, this.pointToCopyFrom!);
        for (const [object, copy] of this.objectToCopy) {
          copy.setModel(mat4.translate(object.getModel(), translation));
        }
        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  handleClick(): void {
    this.clicker.click();
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode == CopyCommandMode.SelectPointToCopyTo) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        const translation: Vec3 = vec3.sub(point, this.pointToCopyFrom!);
        for (const [object, copy] of this.objectToCopy) {
          copy.setModel(mat4.translate(object.getModel(), translation));
        }
      }
    }
  }

  getInstructions(): string {
    switch (this.mode) {
      case CopyCommandMode.SelectPointToCopyFrom:
        return "0:Exit  Select point to copy from.  $";
      case CopyCommandMode.SelectPointToCopyTo:
        return "0:Exit  Select point to copy to.  $";
      default:
        throw new Error("case not implemented");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  done() {
    this.clicker.destroy();
    for (const copy of this.objectToCopy.values()) {
      INSTANCE.getScene().addGeometry(copy);
    }
    this.finished = true;
  }

}
