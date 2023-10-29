import { mat4, Mat4, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderPoints } from "../render/renderPoints";
import { RenderID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Ray } from "./ray";

export class Points extends Geometry {

  private renderPoints!: RenderID;

  constructor(
    parent: Geometry | null,
    private points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.update();
  }

  private update(): void {
    if (this.renderPoints) {
      INSTANCE.getScene().removePoints(this.renderPoints);
    }
    this.renderPoints = INSTANCE.getScene().addRenderPoints(
      new RenderPoints(this, this.points, this.getModel())
    );
  }

  public delete(): void {
    INSTANCE.getScene().removePoints(this.renderPoints);
  }

  public getPoints(): Vec3[] {
    return this.points;
  }

  public override getBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public override intersect(ray: Ray): number | null {
    throw new Error("Method not implemented.");
  }

}
