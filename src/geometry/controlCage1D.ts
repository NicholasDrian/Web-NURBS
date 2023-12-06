import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { RenderMeshInstanced } from "../render/renterMeshInstanced";
import { cloneVec3List } from "../utils/clone";
import { swizzleYZ } from "../utils/math";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { LineBoundingBoxHeirarchy } from "./lineBoundingBoxHeirarchy";
import { PointBoundingBoxHeirarchy } from "./pointBoundingBoxHeirarchy";
import { POINT_INDICES, POINT_MODEL, POINT_VERTS } from "./points";
import { Ray } from "./ray";



export class ControlCage1D extends Geometry {

  private points: RenderMeshInstanced;
  private pointBBH: PointBoundingBoxHeirarchy;

  private renderLines: RenderLines;
  private lineBBH: LineBoundingBoxHeirarchy;

  private vertexSubSelection: boolean[];
  private segmentSubSelection: boolean[];
  private accumulatedSubSelection: boolean[];

  private subSelectedVertCount: number;
  private subSelectedSegmentCount: number;

  private indices: number[];

  constructor(
    parent: Geometry | null,
    private verts: Vec3[],
    model: Mat4 = mat4.identity(),
    materialName: MaterialName | null = null
  ) {
    super(parent, model, materialName);

    this.vertexSubSelection = [];
    this.segmentSubSelection = [];
    this.accumulatedSubSelection = [];
    this.subSelectedVertCount = 0;
    this.subSelectedSegmentCount = 0;


    for (let i = 0; i < this.verts.length; i++) {
      this.vertexSubSelection.push(false);
      this.accumulatedSubSelection.push(false);
      this.segmentSubSelection.push(false);
    }
    this.segmentSubSelection.pop();

    const modelR: Mat4 = this.getModelRecursive();
    const translation: Vec3 = mat4.getTranslation(modelR);
    const modelNoTranslation: Mat4 = mat4.mul(mat4.translation(vec3.scale(translation, -1)), modelR);
    const transforms: Mat4[] = this.verts.map((pos: Vec3) => {
      return swizzleYZ(mat4.mul(mat4.translation(pos), mat4.mul(mat4.inverse(modelNoTranslation), POINT_MODEL)));
    });
    this.points = new RenderMeshInstanced(this,
      POINT_VERTS, POINT_VERTS, POINT_INDICES, transforms, this.accumulatedSubSelection, true);
    INSTANCE.getScene().addRenderMeshInstanced(this.points);


    this.indices = [];
    for (let i = 0; i < this.verts.length - 1; i++) { this.indices.push(i, i + 1); }
    this.renderLines = new RenderLines(this, this.verts, this.indices, this.accumulatedSubSelection);
    INSTANCE.getScene().addRenderLines(this.renderLines);

    this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
    this.lineBBH = new LineBoundingBoxHeirarchy(this, this.verts, this.indices);

    this.hide();

  }

  public showControls(on: boolean): void {
  }

  public getWithinFrustumSub(frustum: Frustum, inclusive: boolean): number[] {
    if (this.isHidden()) return [];
    const res: number[] = this.lineBBH.getWithinFrustumSub(frustum, inclusive).map((n: number) => {
      return n + this.verts.length;
    });
    const model: Mat4 = this.getModelRecursive();
    for (let i = 0; i < this.verts.length; i++) {
      if (frustum.containsPoint(vec3.transformMat4(this.verts[i], model))) {
        res.push(i);
      }
    }
    return res;
  }


  public getBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    for (const v of this.verts) {
      res.addVec3(vec3.transformMat4(v, model));
    }
    return res;
  }

  public getTypeName(): string {
    return "control cage 1d";
  }

  public intersect(ray: Ray, sub: boolean): Intersection | null {
    if (this.isHidden()) return null;
    let intersection: Intersection | null = this.pointBBH.almostIntersect(ray, 10);
    if (intersection === null) {
      intersection = this.lineBBH.almostIntersect(ray, 10);
      if (intersection !== null) {
        intersection.objectSubID += this.verts.length;
      }
    }
    return intersection;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    return this.lineBBH.isWithinFrustum(frustum, inclusive);
  }

  public addToSubSelection(...subIDs: number[]): void {
    for (let subID of subIDs) {
      if (subID >= this.verts.length) {
        subID -= this.verts.length;
        // Line Sub ID
        if (!this.segmentSubSelection[subID]) {
          this.segmentSubSelection[subID] = true;
          this.subSelectedSegmentCount++;
          this.accumulatedSubSelection[subID] = true;
          this.accumulatedSubSelection[subID + 1] = true;
        }
      } else {
        // Point Sub ID
        console.log("sub selecting vert", subID);
        if (!this.vertexSubSelection[subID]) {
          this.vertexSubSelection[subID] = true;
          this.subSelectedVertCount++;
          this.accumulatedSubSelection[subID] = true;
        }
      }
    }
    this.points.updateSubSelection(this.vertexSubSelection);
    this.renderLines.updateSubSelection(this.accumulatedSubSelection);
  }

  public removeFromSubSelection(...subIDs: number[]): void {
    for (let subID of subIDs) {
      if (subID >= this.verts.length) {
        subID -= this.verts.length;
        // Line Sub ID
        if (this.segmentSubSelection[subID]) {
          this.segmentSubSelection[subID] = false;
          this.subSelectedSegmentCount--;
          if (!this.vertexSubSelection[subID] &&
            (subID === 0 || !this.segmentSubSelection[subID - 1])
          ) {
            this.accumulatedSubSelection[subID] = false;
          }
          if (!this.vertexSubSelection[subID + 1] &&
            (subID === this.verts.length - 1 || !this.segmentSubSelection[subID + 1])
          ) {
            this.accumulatedSubSelection[subID + 1] = false;
          }
        }
      } else {
        // Point Sub ID
        if (this.vertexSubSelection[subID]) {
          this.vertexSubSelection[subID] = false;
          this.subSelectedVertCount--;
          if ((subID == this.verts.length - 1 || !this.segmentSubSelection[subID]) &&
            (subID === 0 || !this.segmentSubSelection[subID - 1])
          ) {
            this.accumulatedSubSelection[subID] = false;
          }
        }
      }
    }
    this.points.updateSubSelection(this.vertexSubSelection);
    this.renderLines.updateSubSelection(this.accumulatedSubSelection);
  }

  public getVertsSubSelectionTransformed(): Vec3[] {
    if (!this.hasSubSelection()) {
      return cloneVec3List(this.verts);
    }
    const res: Vec3[] = [];
    var t: Mat4 = INSTANCE.getMover().getTransform();
    const model: Mat4 = this.getModelRecursive();
    t = mat4.mul(mat4.mul(mat4.inverse(model), t), model);
    for (let i = 0; i < this.verts.length; i++) {
      if (this.accumulatedSubSelection[i]) {
        res.push(vec3.transformMat4(this.verts[i], t));
      } else {
        res.push(this.verts[i]);
      }
    }

    this.updatePoints(res);
    this.renderLines.updateVerts(res);
    return cloneVec3List(res);
  }

  public bakeSelectionTransform(): void {

    if (this.isSelected()) {
      this.updatePoints(this.verts);
    } else if (this.hasSubSelection()) {

      let t: Mat4 = INSTANCE.getMover().getTransform();
      const model: Mat4 = this.getModelRecursive();
      t = mat4.mul(mat4.mul(mat4.inverse(model), t), model);

      for (let i = 0; i < this.verts.length; i++) {
        if (this.accumulatedSubSelection[i]) {
          this.verts[i] = vec3.transformMat4(this.verts[i], t);
        }
      }
      this.renderLines.updateVerts(this.verts);
      this.lineBBH = new LineBoundingBoxHeirarchy(this, this.verts, this.indices);
      this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
      this.updatePoints(this.verts);
    }
  }

  private updatePoints(points: Vec3[]): void {
    const model: Mat4 = this.getModelRecursive();
    const translation: Vec3 = mat4.getTranslation(model);
    const modelNoTranslation: Mat4 = mat4.mul(mat4.translation(vec3.scale(translation, -1)), model);
    this.points.updateTransforms(points.map((pos: Vec3) => {
      return swizzleYZ(mat4.mul(mat4.translation(pos), mat4.mul(mat4.inverse(modelNoTranslation), POINT_MODEL)));
    }));
  }

  public isSubSelected(subID: number): boolean {
    if (subID >= this.verts.length) {
      subID -= this.verts.length;
      // Line Sub ID
      return this.segmentSubSelection[subID];
    } else {
      // Point Sub ID
      return this.vertexSubSelection[subID];
    }
  }

  public hasSubSelection(): boolean {
    return this.subSelectedSegmentCount > 0 ||
      this.subSelectedVertCount > 0;
  }

  public getSubSelectionBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    if (!this.hasSubSelection()) return res;
    for (let i = 0; i < this.verts.length; i++) {
      if (this.accumulatedSubSelection[i]) {
        res.addVec3(vec3.transformMat4(this.verts[i], model));
      }
    }
    return res;
  }

  public clearSubSelection(): void {
    if (this.hasSubSelection()) {
      this.accumulatedSubSelection = this.accumulatedSubSelection.map(() => { return false; });
      this.vertexSubSelection = this.vertexSubSelection.map(() => { return false; });
      this.segmentSubSelection = this.segmentSubSelection.map(() => { return false; });
      this.points.updateSubSelection(this.vertexSubSelection);
      this.renderLines.updateSubSelection(this.accumulatedSubSelection);
    }
  }

  public onSelectionMoved(): void {
    this.parent!.onSelectionMoved();
  }

  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
    INSTANCE.getScene().removeMeshInstanced(this.points);
  }

  public clone(): Geometry {
    return new ControlCage1D(this.parent, [...this.verts], mat4.clone(this.model), this.materialName);
  }

}
