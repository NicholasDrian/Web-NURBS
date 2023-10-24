import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { RenderLines } from "../render/renderLines";
import { uuid } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";


export class PolyLine extends Geometry {

  private renderLines!: uuid;
  private boundingBox!: BoundingBox;

  constructor(
    private points: Vec3[],
    private color: [number, number, number, number]
  ) {
    super();
    this.renderLines = 0;
    this.update();
  }

  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  public getSegmentCount(): number {
    return this.points.length - 1;
  }

  public updateLastPoint(point: Vec3): void {
    this.points[this.points.length - 1] = point;
    this.update();
  }

  public removeLastPoint(): void {
    this.points.pop();
    this.update();
  }

  public addPoint(point: Vec3): void {
    this.points.push(point);
    this.update();
  }

  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
  }

  private update(): void {
    if (this.renderLines) INSTANCE.getScene().removeLines(this.renderLines);
    const verts: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < this.points.length; i++) {
      verts.push(...this.points[i], 1.0);
      indices.push(i, i + 1);
    }
    indices.pop(); indices.pop();
    this.renderLines = INSTANCE.getScene().addLines(new RenderLines(
      new Float32Array(verts),
      new Int32Array(indices),
      this.color));
    this.updateBoundingBox();
  }

  private updateBoundingBox(): void {
    this.boundingBox = new BoundingBox();
    for (let point of this.points) this.boundingBox.addVec3(point);
  }

}
