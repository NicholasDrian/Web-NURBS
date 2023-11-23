import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Ray } from "../../geometry/ray";
import { ObjectID } from "../../scene/scene";
import { getRotationTransform } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";


enum PollarArrayCommandMode {
  EnterCount,
  EnterCenter,
  EnterAxis,
  Options,
  EnterFirstPointOrAngle,
  EnterFinalPointOrFlip,
}

export class PollarArrayCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private count: number | null;
  private centerPoint: Vec3 | null;
  private axis: Ray | null;
  private basePoint: Vec3 | null;
  private angle: number | null;
  private geometry: Geometry[];
  private arrayedGeometry: Geometry[][];
  private mode: PollarArrayCommandMode;
  private useAngleBetween: boolean | null;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.count = null;
    this.basePoint = null;
    this.centerPoint = null;
    this.axis = null;
    this.useAngleBetween = null;
    this.angle = null;
    this.geometry = [];
    this.arrayedGeometry = [];
    this.mode = PollarArrayCommandMode.EnterCount;

    const selected: Set<ObjectID> = INSTANCE.getSelector().getSelection();
    if (selected.size === 0) {
      this.done();
      return;
    }

    for (const id of selected) {
      this.geometry.push(INSTANCE.getScene().getGeometry(id));
    }

  }

  handleInputString(input: string): void {
    if (input == "0") {
      for (const v of this.arrayedGeometry) {
        for (const geo of v) {
          geo.delete();
        }
      }
      this.done();
      return;
    }
    switch (this.mode) {
      case PollarArrayCommandMode.EnterCount:
        const count: number = parseInt(input);
        if (!isNaN(count) && count > 1) {
          this.count = count;
          this.mode = PollarArrayCommandMode.EnterCenter;
        }
        break;
      case PollarArrayCommandMode.EnterCenter:
        break;
      case PollarArrayCommandMode.EnterAxis:
        if (input == "1") {
          this.axis = new Ray(this.centerPoint!, vec3.create(0, 0, 1));
          this.mode = PollarArrayCommandMode.Options;
        }
        break;
      case PollarArrayCommandMode.Options:
        if (input == "1") { // full circle
          this.angle = 360 * (this.count! - 1) / this.count!;
          this.useAngleBetween = false;
          this.createClones();
          this.setTransforms();
          this.done();
        } else if (input == "2") { // angle between
          this.useAngleBetween = true;
          this.mode = PollarArrayCommandMode.EnterFirstPointOrAngle;
        } else if (input == "3") { // total angle
          this.useAngleBetween = false;
          this.mode = PollarArrayCommandMode.EnterFirstPointOrAngle;
        }
        break;
      case PollarArrayCommandMode.EnterFirstPointOrAngle:
        break;
      case PollarArrayCommandMode.EnterFinalPointOrFlip:
        break;
      default:
        throw new Error("Case not implemented");
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case PollarArrayCommandMode.EnterCount:
        break;
      case PollarArrayCommandMode.EnterCenter:
        this.centerPoint = intersection.point;
        this.mode = PollarArrayCommandMode.EnterAxis;
        break;
      case PollarArrayCommandMode.EnterAxis:
        if (!vec3.equals(intersection.point, this.centerPoint!)) {
          this.axis = new Ray(this.centerPoint!, vec3.sub(intersection.point, this.centerPoint!));
          this.mode = PollarArrayCommandMode.Options;
        }
        break;
      case PollarArrayCommandMode.Options:
        break;
      case PollarArrayCommandMode.EnterFirstPointOrAngle:
        break;
      case PollarArrayCommandMode.EnterFinalPointOrFlip:
        break;
      default:
        throw new Error("Case not implemented");
    }
    this.clicker.reset();
  }

  handleClick(): void {
    this.clicker.click();
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    //TODO:
  }

  getInstructions(): string {
    switch (this.mode) {
      case PollarArrayCommandMode.EnterCount:
        return "0:Exit  Enter count.  $";
      case PollarArrayCommandMode.EnterCenter:
        return "0:Exit  Click center point.  $";
      case PollarArrayCommandMode.EnterAxis:
        return "0:Exit  1:Use Z-Axis  Click axis point.  $"
      case PollarArrayCommandMode.Options:
        return "0:Exit  1:Full Circle  2:Angle Between  3:Total Angle.  Select an option.  $";
      case PollarArrayCommandMode.EnterFirstPointOrAngle:
        return "0:Exit  Click first point or enter angle.  $";
      case PollarArrayCommandMode.EnterFinalPointOrFlip:
        return "0:Exit  1:Flip  Click second angle point.  $";
      default:
        throw new Error("Case not implemented");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    for (const v of this.arrayedGeometry) {
      for (const geo of v) {
        INSTANCE.getScene().addGeometry(geo);
      }
    }
  }

  private createClones(): void {
    for (let i = 1; i < this.count!; i++) {
      const clones: Geometry[] = [];
      for (const geo of this.geometry) {
        clones.push(geo.clone());
      }
      this.arrayedGeometry.push(clones);
    }
  }

  private setTransforms(): void {
    const rads: number = this.angle! * Math.PI / 180;
    var angleBetween: number;
    if (this.useAngleBetween) {
      angleBetween = rads;
    } else {
      angleBetween = rads / (this.count! - 1);
    }
    for (let i = 1; i < this.count!; i++) {
      const angle = angleBetween * i;
      const transform: Mat4 = getRotationTransform(this.axis!, angle);
      for (let j = 0; j < this.geometry.length; j++) {
        this.arrayedGeometry[i - 1][j].setModel(mat4.mul(transform, this.geometry[j].getModel()));
      }
    }
  }

}
