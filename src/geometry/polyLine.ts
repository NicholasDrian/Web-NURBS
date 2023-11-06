import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { RenderID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { LineBoundingBoxHeirarchy } from "./lineBoundingBoxHeirarchy";
import { Ray } from "./ray";


export class PolyLine extends Geometry {

  private renderLines!: RenderID;
  private boundingBox!: BoundingBox;
  private boundingBoxHeirarchy!: LineBoundingBoxHeirarchy;

  constructor(
    parent: Geometry | null,
    private points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.renderLines = 0;
    this.update();
  }

  public intersect(ray: Ray): Intersection | null {
    return this.boundingBoxHeirarchy.almostIntersect(ray, this.points, 20);
  }

  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  public getSegmentCount(): number {
    return this.points.length - 1;
  }
  public override getTypeName(): string {
    return "PolyLine";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    return this.boundingBoxHeirarchy.isWithinFrustum(frustum, inclusive);
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

    const verts: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < this.points.length; i++) {
      verts.push(...this.points[i], 1.0);
      indices.push(i, i + 1);
    }
    indices.pop(); indices.pop();

    if (this.renderLines) INSTANCE.getScene().removeLines(this.renderLines);
    const renderLinesObj = new RenderLines(
      this,
      new Float32Array(verts),
      new Int32Array(indices),
      this.getModel(),
    )
    this.renderLines = renderLinesObj.getID();
    INSTANCE.getScene().addRenderLines(renderLinesObj);

    this.updateBoundingBox();
    this.boundingBoxHeirarchy = new LineBoundingBoxHeirarchy(this.getID(), this.points, indices);
  }

  private updateBoundingBox(): void {
    this.boundingBox = new BoundingBox();
    const model: Mat4 = this.getModel();
    this.points.forEach((point: Vec3) => {
      this.boundingBox.addVec3(vec3.transformMat4(point, model));
    });
  }

}
