import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { createSphere } from "../../geometry/nurbs/sphere";
import { Surface } from "../../geometry/nurbs/surface";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum SphereCommandMode {
  Menu,
  PointA,
  PointB,
  SelectCenter,
  SelectRadius
}

export class SphereCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private temp: Vec3 | null;
  private mode: SphereCommandMode;
  private sphere: Surface | null;

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.temp = null;
    this.mode = SphereCommandMode.Menu;
    this.sphere = null;
  }

  handleInputString(input: string): void {
    if (input == "0") {
      this.sphere?.delete();
      this.sphere = null;
      this.done();
    }
    switch (this.mode) {
      case SphereCommandMode.Menu:
        if (input == "1") this.mode = SphereCommandMode.SelectCenter;
        else if (input == "2") this.mode = SphereCommandMode.PointA;
        break;
      case SphereCommandMode.PointA:
        break;
      case SphereCommandMode.PointB:
        break;
      case SphereCommandMode.SelectCenter:
        break;
      case SphereCommandMode.SelectRadius:
        break;
      default:
        throw new Error("case not implemented");
    }

  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case SphereCommandMode.Menu:
        break;
      case SphereCommandMode.PointA:
        this.temp = intersection.point;
        this.mode = SphereCommandMode.PointB;
        break;
      case SphereCommandMode.PointB:
        this.updateSphere(intersection.point);
        this.done();
        break;
      case SphereCommandMode.SelectCenter:
        this.temp = intersection.point;
        this.mode = SphereCommandMode.SelectRadius;
        break;
      case SphereCommandMode.SelectRadius:
        this.updateSphere(intersection.point);
        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
    this.clicker.reset();
  }
  handleClick(): void {
    this.clicker.click();
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
    if (this.mode === SphereCommandMode.SelectRadius || this.mode === SphereCommandMode.PointB) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point && !vec3.equals(point, this.temp!)) {
        this.updateSphere(point);
      }
    }
  }

  private updateSphere(pos: Vec3): void {
    if (this.mode === SphereCommandMode.SelectRadius) {
      const radius: number = vec3.distance(this.temp!, pos);
      if (this.sphere === null) this.sphere = createSphere(vec3.create(0, 0, 0), 1);
      const translation: Mat4 = mat4.translation(this.temp!);
      const scale: Mat4 = mat4.uniformScaling(radius);
      this.sphere.setModel(mat4.mul(translation, scale));

    } else if (this.mode === SphereCommandMode.PointB) {
      const center: Vec3 = vec3.scale(vec3.add(this.temp!, pos), 0.5);
      const radius: number = vec3.distance(this.temp!, center);
      if (this.sphere === null) this.sphere = createSphere(vec3.create(0, 0, 0), 1);
      const translation: Mat4 = mat4.translation(center);
      const scale: Mat4 = mat4.uniformScaling(radius);
      this.sphere.setModel(mat4.mul(translation, scale));
    }
  }


  getInstructions(): string {
    switch (this.mode) {
      case SphereCommandMode.Menu:
        return "0:Exit  1:FromCenterAndRadius  2:Between2Points  $";
      case SphereCommandMode.PointA:
        return "0:Exit  Click Point A.  $";
      case SphereCommandMode.PointB:
        return "0:Exit  Click Point B.  $";
      case SphereCommandMode.SelectCenter:
        return "0:Exit  Click Center Point.  $";
      case SphereCommandMode.SelectRadius:
        return "0:Exit  Click radial point or enter radius.  $";
      default:
        throw new Error("case not implemented");
    }
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    if (this.sphere) {
      INSTANCE.getScene().addGeometry(this.sphere);
    }
  }

  isFinished(): boolean {
    return this.finished
  }

}
