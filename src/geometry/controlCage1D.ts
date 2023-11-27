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
import { Ray } from "./ray";

const controlPointVerts: Vec3[] = [
  vec3.create(1, 0, 0),
  vec3.create(0, 1, 0),
  vec3.create(0, 0, 1),
  vec3.create(-1, 0, 0),
  vec3.create(0, -1, 0),
  vec3.create(0, 0, -1),
];

const controlPointIndices: number[] = [
  0, 1, 2,
  0, 2, 4,
  0, 4, 5,
  0, 5, 1,

  3, 1, 5,
  3, 5, 4,
  3, 4, 2,
  3, 2, 1,
];

const controlPointModel: Mat4 = mat4.uniformScaling(0.01);

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


    const transforms: Mat4[] = []
    for (const vert of this.verts) {
      transforms.push(swizzleYZ(mat4.mul(mat4.translation(vert), controlPointModel)));
    }
    this.points = new RenderMeshInstanced(this,
      controlPointVerts, controlPointVerts, controlPointIndices, transforms, this.accumulatedSubSelection, true);
    INSTANCE.getScene().addRenderMeshInstanced(this.points);


    const indices: number[] = [];
    for (let i = 0; i < this.verts.length - 1; i++) { indices.push(i, i + 1); }
    this.renderLines = new RenderLines(this, this.verts, indices, this.accumulatedSubSelection);
    INSTANCE.getScene().addRenderLines(this.renderLines);

    this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
    this.lineBBH = new LineBoundingBoxHeirarchy(this, this.verts, indices);

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

  public intersect(ray: Ray): Intersection | null {
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
    throw new Error("Method not implemented.");
  }

  public addToSubSelection(subID: number): void {
    if (subID >= this.verts.length) {
      subID -= this.verts.length;
      // Line Sub ID
      if (!this.segmentSubSelection[subID]) {
        this.segmentSubSelection[subID] = true;
        this.subSelectedSegmentCount++;
        this.accumulatedSubSelection[subID] = true;
        this.accumulatedSubSelection[subID + 1] = true;
        this.points.updateSubSelection(this.vertexSubSelection);
        this.renderLines.updateSubSelection(this.accumulatedSubSelection);
      }
    } else {
      // Point Sub ID
      if (!this.vertexSubSelection[subID]) {
        this.vertexSubSelection[subID] = true;
        this.subSelectedVertCount++;
        this.accumulatedSubSelection[subID] = true;
        this.points.updateSubSelection(this.vertexSubSelection);
        this.renderLines.updateSubSelection(this.accumulatedSubSelection);
      }
    }
  }

  public removeFromSubSelection(subID: number): void {
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
        this.points.updateSubSelection(this.vertexSubSelection);
        this.renderLines.updateSubSelection(this.accumulatedSubSelection);
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
        this.points.updateSubSelection(this.vertexSubSelection);
        this.renderLines.updateSubSelection(this.accumulatedSubSelection);
      }
    }
  }

  public getVertsSubSelectionTransformed(): Vec3[] {
    if (!this.hasSubSelection()) {
      return cloneVec3List(this.verts);
    }
    const res: Vec3[] = [];
    const t: Mat4 = INSTANCE.getMover().getTransform();
    for (let i = 0; i < this.verts.length; i++) {
      if (this.accumulatedSubSelection[i]) {
        res.push(vec3.transformMat4(this.verts[i], t));
      } else {
        res.push(this.verts[i]);
      }
    }
    this.points.updateTransforms(res.map((pos: Vec3) => {
      return swizzleYZ(mat4.mul(mat4.translation(pos), controlPointModel));
    }));
    this.renderLines.updateVerts(res);
    return cloneVec3List(res);
  }

  public bakeSelectionTransform(): void {
    if (!this.hasSubSelection()) {
      return;
    }
    const newVerts: Vec3[] = [];
    const t: Mat4 = INSTANCE.getMover().getTransform();
    const indices: number[] = [];
    for (let i = 0; i < this.verts.length; i++) {
      if (this.accumulatedSubSelection[i]) {
        newVerts.push(vec3.transformMat4(this.verts[i], t));
      } else {
        newVerts.push(this.verts[i]);
      }
      indices.push(i, i + 1);
    }
    indices.pop();
    indices.pop();
    this.points.updateTransforms(newVerts.map((pos: Vec3) => {
      return swizzleYZ(mat4.mul(mat4.translation(pos), controlPointModel));
    }));
    this.renderLines.updateVerts(newVerts);
    this.verts = newVerts;
    this.lineBBH = new LineBoundingBoxHeirarchy(this, this.verts, indices);
    this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
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
    if (!this.hasSubSelection()) return res;
    for (let i = 0; i < this.verts.length; i++) {
      if (this.accumulatedSubSelection[i]) {
        res.addVec3(this.verts[i]);
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
    INSTANCE.getScene().removeGeometry(this);
  }

  public clone(): Geometry {
    return new ControlCage1D(this.parent, [...this.verts], mat4.clone(this.model), this.materialName);
  }

}
