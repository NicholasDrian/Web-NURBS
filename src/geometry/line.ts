import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { RenderLines } from "../render/renderLines";
import { RenderID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";


export class Line extends Geometry {

  private renderLines!: RenderID;
  private boundingBox!: BoundingBox;

  constructor(
    private start: Vec3,
    private end: Vec3,
    private color: [number, number, number, number],
    private model: Mat4 = mat4.identity()
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

    // add new lines
    this.renderLines = INSTANCE.getScene().addRenderLines(new RenderLines(
      new Float32Array([...this.start, 1.0, ...this.end, 1.0]),
      new Int32Array([0, 1]),
      this.color
    ));
  }

  public getModel(): Mat4 {
    return this.model;
  }

  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
  }

  public getStart(): Vec3 {
    return this.start;
  }

  public getEnd(): Vec3 {
    return this.end;
  }

  public updateEnd(point: Vec3): void {
    this.end = point;
    this.updateRenderLines();
    this.updateBoundingBox();
  }

  public getLength(): number {
    return vec3.distance(this.start, this.end);
  }

  public flip(): void {
    [this.start, this.end] = [this.end, this.start];
  }
  private updateBoundingBox(): void {
    this.boundingBox = new BoundingBox();
    this.boundingBox.addVec3(vec3.transformMat4(this.start, this.model));
    this.boundingBox.addVec3(vec3.transformMat4(this.end, this.model));
  }

}
