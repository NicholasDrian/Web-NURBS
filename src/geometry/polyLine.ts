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

// TODO: Should be wrapper around control cage

export class PolyLine extends Geometry {

  private renderLines!: RenderLines | null;
  private boundingBoxHeirarchy!: LineBoundingBoxHeirarchy;
  private subSelectedSegments!: boolean[];
  private subSelectedVerts!: boolean[];

  constructor(
    parent: Geometry | null,
    private points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.renderLines = null;
    this.subSelectedVerts = [];
    this.subSelectedSegments = [];
    this.update();
  }

  public addToSubSelection(subID: number): void {
    this.subSelectedSegments[subID] = true;
    this.subSelectedVerts[subID] = true;
    this.subSelectedVerts[subID + 1] = true;
    this.renderLines!.updateSubSelection(this.subSelectedVerts);
  }

  public removeFromSubSelection(subID: number): void {
    this.subSelectedSegments[subID] = false;
    this.subSelectedVerts[subID] = (subID > 0) && this.subSelectedSegments[subID - 1];
    this.subSelectedVerts[subID + 1] = (subID < this.subSelectedSegments.length - 1) && this.subSelectedSegments[subID + 1];
    this.renderLines!.updateSubSelection(this.subSelectedVerts);
  }

  public isSubSelected(subID: number): boolean {
    return this.subSelectedSegments[subID];
  }

  public clearSubSelection(): void {
    throw new Error("Method not implemented.");
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

    const indices: number[] = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      indices.push(i, i + 1);
    }

    this.subSelectedSegments = [];
    for (let i = 0; i <= this.points.length - 1; i++) {
      this.subSelectedSegments.push(false);
      this.subSelectedVerts.push(false);
    }
    this.subSelectedSegments.pop();

    if (this.renderLines !== null) INSTANCE.getScene().removeLines(this.renderLines);
    this.renderLines = new RenderLines(
      this,
      this.points,
      indices,
      this.subSelectedSegments
    )
    INSTANCE.getScene().addRenderLines(this.renderLines);

    this.boundingBoxHeirarchy = new LineBoundingBoxHeirarchy(this, this.points, indices);
  }


}
