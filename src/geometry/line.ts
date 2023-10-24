import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { RenderLines } from "../render/renderLines";
import { uuid } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";


export class Line extends Geometry {

  private renderLines!: uuid;
  private boundingBox!: BoundingBox;

  constructor(
    private a: Vec3,
    private b: Vec3,
    private color: [number, number, number, number]
  ) {
    super();
    this.renderLines = 0;
    this.updateRenderLines();
    this.updateBoundingBox();
  }

  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  private updateRenderLines(): void {

    // remove previous lines
    if (this.renderLines) INSTANCE.getScene().removeLines(this.renderLines);

    // add mew lines
    this.renderLines = INSTANCE.getScene().addLines(new RenderLines(
      new Float32Array([...this.a, 1.0, ...this.b, 1.0]),
      new Int32Array([0, 1]),
      this.color
    ));
  }


  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
  }

  public getStart(): Vec3 {
    return this.a;
  }

  public getEnd(): Vec3 {
    return this.b;
  }

  public updateEnd(point: Vec3): void {
    this.b = point;
    this.updateRenderLines();
    this.updateBoundingBox();
  }

  public getLength(): number {
    return vec3.distance(this.a, this.b);
  }

  public flip(): void {
    [this.a, this.b] = [this.b, this.a];
  }
  private updateBoundingBox(): void {
    this.boundingBox = new BoundingBox();
    this.boundingBox.addVec3(this.a);
    this.boundingBox.addVec3(this.b);
  }

}
