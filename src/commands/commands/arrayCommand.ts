

import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum LinearArrayCommandMode {
  EnterCount,
  BasePoint,
  DirectionPoint,
}

export class LinearArrayCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private mode: LinearArrayCommandMode;
  private geometry: Geometry[];
  private arrayedGeometry: Geometry[][];
  private basePoint: Vec3 | null;
  private directionPoint: Vec3 | null;
  private count: number | null;


  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.mode = LinearArrayCommandMode.EnterCount;
    this.geometry = [];
    this.arrayedGeometry = [];
    this.basePoint = null;
    this.directionPoint = null;
    this.count = null;

    const selected: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selected.size === 0) {
      this.done();
      return;
    }

    for (const geo of selected) {
      this.geometry.push(geo);
    }

  }

  handleInputString(input: string): void {

    if (input == "0") {
      this.done();
      return;
    }

    switch (this.mode) {
      case LinearArrayCommandMode.EnterCount:
        const count: number = parseInt(input);
        if (!isNaN(count) && count > 1) {
          this.count = count;
          this.mode = LinearArrayCommandMode.BasePoint;
        }
        break;
      case LinearArrayCommandMode.BasePoint:
        break;
      case LinearArrayCommandMode.DirectionPoint:
        break;
      default:
        throw new Error("case not implemented");
    }

  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case LinearArrayCommandMode.EnterCount:
        break;
      case LinearArrayCommandMode.BasePoint:
        this.basePoint = intersection.point;
        this.mode = LinearArrayCommandMode.DirectionPoint;
        for (var i = 1; i < this.count!; i++) {
          const translated: Geometry[] = [];
          for (const geo of this.geometry) {
            translated.push(geo.clone());
          }
          this.arrayedGeometry.push(translated);
        }
        break;
      case LinearArrayCommandMode.DirectionPoint:
        this.directionPoint = intersection.point;
        this.setTranslation();
        for (const v of this.arrayedGeometry) {
          for (const geo of v) {
            INSTANCE.getScene().addGeometry(geo);
            this.geometry.push(geo);
          }
        }
        this.arrayedGeometry = [];
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
    if (this.mode == LinearArrayCommandMode.DirectionPoint) {
      const point: Vec3 | null = this.clicker.getPoint();
      if (point) {
        this.directionPoint = point;
        this.setTranslation();
      }
    }
  }
  getInstructions(): string {
    switch (this.mode) {
      case LinearArrayCommandMode.EnterCount:
        return "0:Exit  Enter array count.  $";
      case LinearArrayCommandMode.BasePoint:
        return "0:Exit  Click base point.  $";
      case LinearArrayCommandMode.DirectionPoint:
        return "0:Exit  Click direction point.  $";
      default:
        throw new Error("case not implemented");
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
        geo.delete();
      }
    }
  }

  private setTranslation(): void {
    const translation: Vec3 = vec3.sub(this.directionPoint!, this.basePoint!);
    for (let i = 1; i < this.count!; i++) {
      const scaledTranslation: Vec3 = vec3.scale(translation, i);
      const transform: Mat4 = mat4.translation(scaledTranslation);
      for (let j = 0; j < this.geometry.length; j++) {
        this.arrayedGeometry[i - 1][j].setModel(mat4.mul(transform, this.geometry[j].getModel()));
      }
    }

  }

}
