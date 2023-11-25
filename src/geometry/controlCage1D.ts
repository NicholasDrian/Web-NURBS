import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { RenderPoints } from "../render/renderPoints";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { LineBoundingBoxHeirarchy } from "./lineBoundingBoxHeirarchy";
import { PointBoundingBoxHeirarchy } from "./pointBoundingBoxHeirarchy";
import { Ray } from "./ray";

export class ControlCage1D extends Geometry {

  private renderPoints: RenderPoints;
  private pointBBH: PointBoundingBoxHeirarchy;

  private renderLines: RenderLines;
  private lineBBH: LineBoundingBoxHeirarchy;

  private vertexSubSelection: boolean[];
  private segmentSubSelection: boolean[];
  private accumulatedSubSelection: boolean[];

  constructor(
    parent: Geometry | null,
    private points: Vec3[],
    model: Mat4 = mat4.identity(),
    materialName: MaterialName | null = null
  ) {
    super(parent, model, materialName);

    this.vertexSubSelection = [];
    this.segmentSubSelection = [];
    this.accumulatedSubSelection = [];

    for (let i = 0; i < this.points.length; i++) {
      this.vertexSubSelection.push(false);
      this.accumulatedSubSelection.push(false);
      this.segmentSubSelection.push(false);
    }
    this.segmentSubSelection.pop();

    const indices: number[] = [];
    for (let i = 0; i < this.points.length - 1; i++) { indices.push(i, i + 1); }

    this.renderPoints = new RenderPoints(this, this.points, this.accumulatedSubSelection);
    this.renderLines = new RenderLines(this, this.points, indices, this.accumulatedSubSelection);

    INSTANCE.getScene().addRenderLines(this.renderLines);
    INSTANCE.getScene().addRenderPoints(this.renderPoints);

    this.pointBBH = new PointBoundingBoxHeirarchy(this, this.points);
    this.lineBBH = new LineBoundingBoxHeirarchy(this, this.points, indices);

  }

  public getBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    for (const v of this.points) {
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
        intersection.objectSubID += this.points.length;
      }
    }
    return intersection;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    throw new Error("Method not implemented.");
  }

  public addToSubSelection(subID: number): void {
    if (subID >= this.points.length) {
      subID -= this.points.length;
      // Line Sub ID
      this.segmentSubSelection[subID] = true;
      this.accumulatedSubSelection[subID] = true;
      this.accumulatedSubSelection[subID + 1] = true;
    } else {
      // Point Sub ID
      this.vertexSubSelection[subID] = true;
      this.accumulatedSubSelection[subID] = true;
    }
    this.renderPoints.updateSubSelection(this.accumulatedSubSelection);
    this.renderLines.updateSubSelection(this.accumulatedSubSelection);
  }

  public removeFromSubSelection(subID: number): void {
    if (subID >= this.points.length) {
      subID -= this.points.length;
      // Line Sub ID
      this.segmentSubSelection[subID] = false;
      if (!this.vertexSubSelection[subID]) { this.accumulatedSubSelection[subID] = false; }
      if (!this.vertexSubSelection[subID + 1]) { this.accumulatedSubSelection[subID + 1] = false; }
    } else {
      // Point Sub ID
      this.vertexSubSelection[subID] = false;
      if (
        (subID == this.points.length - 1 || !this.segmentSubSelection[subID]) &&
        (subID === 0 || !this.segmentSubSelection[subID - 1])
      ) {
        this.accumulatedSubSelection[subID] = false;
      }
    }
    this.renderPoints.updateSubSelection(this.accumulatedSubSelection);
    this.renderLines.updateSubSelection(this.accumulatedSubSelection);
  }

  public isSubSelected(subID: number): boolean {
    if (subID >= this.points.length) {
      subID -= this.points.length;
      // Line Sub ID
      return this.segmentSubSelection[subID];
    } else {
      // Point Sub ID
      return this.vertexSubSelection[subID];
    }
  }

  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
    INSTANCE.getScene().removePoints(this.renderPoints);
    INSTANCE.getScene().removeGeometry(this);
  }

  public clone(): Geometry {
    return new ControlCage1D(this.parent, [...this.points], mat4.clone(this.model), this.materialName);
  }

}
