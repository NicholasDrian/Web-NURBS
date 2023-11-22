import { mat4, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { ObjectID } from "../../scene/scene";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum MirrorCommandMode {
  SelectFirstPoint,
  SelectSecondPoint,
  SelectThirdPoint,
}

export class MirrorCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private oldToNew: Map<Geometry, Geometry>;
  private mode: MirrorCommandMode;
  private pointA: Vec3 | null;
  private pointB: Vec3 | null;
  private pointC: Vec3 | null;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.oldToNew = new Map<Geometry, Geometry>();
    this.mode = MirrorCommandMode.SelectFirstPoint;
    this.pointA = null;
    this.pointB = null;
    this.pointC = null;
    const selection: Set<ObjectID> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.done();
    }
  }

  public handleInputString(input: string): void {
    if (input == "0") this.done();
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        break;
      case MirrorCommandMode.SelectSecondPoint:
        break;
      case MirrorCommandMode.SelectThirdPoint:
        // todo
        break;
      default:
        throw new Error("case not implemented");
    }

  }

  public handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        this.pointA = intersection.point;
        const selection: Set<ObjectID> = INSTANCE.getSelector().getSelection();
        for (const id of selection) {
          this.oldToNew.set(
            INSTANCE.getScene().getGeometry(id),
            INSTANCE.getScene().getGeometry(id).clone(),
          );
        }
        this.mode = MirrorCommandMode.SelectSecondPoint;
        this.clicker.reset();
        break;
      case MirrorCommandMode.SelectSecondPoint:


        this.mode = MirrorCommandMode.SelectThirdPoint;
        this.clicker.reset();
        break;
      case MirrorCommandMode.SelectThirdPoint:

        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  public handleClick(): void {
    this.clicker.click();
  }

  public handleMouseMove(): void {
    this.clicker.onMouseMove();
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        break;
      case MirrorCommandMode.SelectSecondPoint:
        const point: Vec3 | null = this.clicker.getPoint();

        break;
      case MirrorCommandMode.SelectThirdPoint:
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  public getInstructions(): string {
    switch (this.mode) {
      case MirrorCommandMode.SelectFirstPoint:
        return "0:Exit  Click first point on mirror plane.  $";
      case MirrorCommandMode.SelectSecondPoint:
        return "0:Exit  Click second point on mirror plane.  $";
      case MirrorCommandMode.SelectThirdPoint:
        return "0:Exit  Click optional third point on mirror plane.  $";
      default:
        throw new Error("case not implemented");
    }
  }

  public isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    for (let geo of this.oldToNew.values()) {
      INSTANCE.getScene().addGeometry(geo);
    }
  }

}
