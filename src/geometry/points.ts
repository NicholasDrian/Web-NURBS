import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderPoints } from "../render/renderPoints";
import { cloneVec3List } from "../utils/clone";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { PointBoundingBoxHeirarchy } from "./pointBoundingBoxHeirarchy";
import { Ray } from "./ray";

export class Points extends Geometry {

  private pointBBH: PointBoundingBoxHeirarchy;
  private subSelection: boolean[];
  private subSelectionCount: number;
  private renderPoints: RenderPoints;

  constructor(
    parent: Geometry | null,
    private verts: Vec3[],
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
    this.subSelection = [];
    for (let i = 0; i < this.verts.length; i++) this.subSelection.push(false);
    this.subSelectionCount = 0;
    this.renderPoints = new RenderPoints(this, this.verts, this.subSelection);
  }

  public getBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    for (const vert of this.verts) {
      res.addVec3(vec3.transformMat4(vert, model));
    }
    return res;
  }

  public getTypeName(): string {
    return "Points";
  }

  public intersect(ray: Ray, sub: boolean): Intersection | null {
    if (this.isHidden()) return null;
    return this.pointBBH.almostIntersect(ray, 10)
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    const bb: BoundingBox = this.getBoundingBox();
    if (frustum.containsBoundingBoxFully(bb)) {
      return true;
    }
    if (!frustum.intersectsBoundingBox(bb)) {
      return false;
    }
    const model: Mat4 = this.getModelRecursive();
    for (const vert of this.verts) {
      if (!frustum.containsPoint(vec3.transformMat4(vert, model))) {
        return false;
      }
    }
    return true;
  }

  public addToSubSelection(subID: number): void {
    if (!this.subSelection[subID]) {
      this.subSelectionCount++;
      this.subSelection[subID] = true;
      this.renderPoints.updateSubSelection(this.subSelection);
    }
  }

  public removeFromSubSelection(subID: number): void {
    if (this.subSelection[subID]) {
      this.subSelectionCount--;
      this.subSelection[subID] = false;
      this.renderPoints.updateSubSelection(this.subSelection);
    }
  }

  public clearSubSelection(): void {
    for (let i = 0; i < this.subSelection.length; i++) {
      this.subSelection[i] = false;
    }
    this.renderPoints.updateSubSelection(this.subSelection);
  }

  public isSubSelected(subID: number): boolean {
    return this.subSelection[subID];
  }

  public getSubSelectionBoundingBox(): BoundingBox {
    const bb: BoundingBox = new BoundingBox();
    if (this.subSelectionCount == 0) return bb;
    const model: Mat4 = this.getModelRecursive();
    for (let i = 0; i < this.verts.length; i++) {
      if (this.subSelection[i]) {
        bb.addVec3(vec3.transformMat4(this.verts[i], model));
      }
    }
    return bb;
  }

  public showControls(on: boolean): void {
  }

  public onSelectionMoved(): void {
    throw new Error("Method not implemented.");
  }

  public bakeSelectionTransform(): void {
    throw new Error("Method not implemented.");
  }

  public delete(): void {
    INSTANCE.getScene().removePoints(this.renderPoints);
  }

  public clone(): Geometry {
    return new Points(this.parent, cloneVec3List(this.verts), mat4.clone(this.model), this.materialName);
  }

}
