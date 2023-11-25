import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { cloneVec3List } from "../utils/clone";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { LineBoundingBoxHeirarchy } from "./lineBoundingBoxHeirarchy";
import { Ray } from "./ray";


export class PolyLine extends Geometry {

  private renderLines!: RenderLines | null;
  private boundingBoxHeirarchy!: LineBoundingBoxHeirarchy;
  private subSelectedSegments!: boolean[];

  constructor(
    parent: Geometry | null,
    private points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.renderLines = null;
    this.subSelectedSegments = [];
    this.update();
  }

  public addToSubSelection(subID: number): void {
    this.subSelectedSegments[subID] = true;
    this.renderLines!.updateSubSelection(this.subSelectedSegments);
  }
  public removeFromSubSelection(subID: number): void {
    this.subSelectedSegments[subID] = false;
    this.renderLines!.updateSubSelection(this.subSelectedSegments);
  }
  public isSubSelected(subID: number): boolean {
    return this.subSelectedSegments[subID];
  }

  public clone(): Geometry {
    return new PolyLine(this.parent, cloneVec3List(this.points), mat4.clone(this.model), this.materialName);
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    return this.boundingBoxHeirarchy.almostIntersect(ray, 10)
  }

  public getBoundingBox(): BoundingBox {
    const res = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    this.points.forEach((point: Vec3) => {
      res.addVec3(vec3.transformMat4(point, model));
    });
    return res;
  }

  public getSegmentCount(): number {
    return this.points.length - 1;
  }

  public override getTypeName(): string {
    return "PolyLine";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
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

  public override delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines!);
    INSTANCE.getScene().removeGeometry(this);
  }

  private update(): void {

    const verts: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < this.points.length; i++) {
      verts.push(...this.points[i], 1.0);
      indices.push(i, i + 1);
    }
    indices.pop(); indices.pop();

    this.subSelectedSegments = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      this.subSelectedSegments.push(false);
    }

    if (this.renderLines !== null) INSTANCE.getScene().removeLines(this.renderLines);
    this.renderLines = new RenderLines(
      this,
      new Float32Array(verts),
      new Int32Array(indices),
      this.subSelectedSegments
    )
    INSTANCE.getScene().addRenderLines(this.renderLines);

    this.boundingBoxHeirarchy = new LineBoundingBoxHeirarchy(this, this.points, indices);
  }


}
