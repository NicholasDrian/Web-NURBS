import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { RenderMeshInstanced } from "../render/renterMeshInstanced";
import { cloneVec3List, cloneVec3ListList } from "../utils/clone";
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

export class ControlCage2D extends Geometry {

  private points: RenderMeshInstanced;
  private pointBBH: PointBoundingBoxHeirarchy;

  private u: number;
  private v: number;

  private renderLines: RenderLines;
  private lineBBH: LineBoundingBoxHeirarchy;

  private vertexSubSelection: boolean[];
  private segmentSubSelection: boolean[];
  private accumulatedSubSelection: boolean[];

  private subSelectedVertCount: number;
  private subSelectedSegmentCount: number;

  private verts: Vec3[];
  private indices: number[];


  constructor(
    parent: Geometry | null,
    points: Vec3[][],
    model: Mat4 = mat4.identity(),
    materialName: MaterialName | null = null
  ) {
    super(parent, model, materialName);



    this.vertexSubSelection = [];
    this.segmentSubSelection = [];
    this.accumulatedSubSelection = [];
    this.subSelectedVertCount = 0;
    this.subSelectedSegmentCount = 0;

    this.u = points.length;
    this.v = points[0].length;

    for (let i = 0; i < this.u * this.v; i++) {
      this.vertexSubSelection.push(false);
      this.accumulatedSubSelection.push(false);
    }
    for (let i = 0; i < (this.u - 1) * this.v + this.u * (this.v - 1); i++) {
      this.segmentSubSelection.push(false);
    }

    this.verts = [];
    for (const list of points) for (const point of list) this.verts.push(point);

    const transforms: Mat4[] = []
    for (const vert of this.verts) {
      transforms.push(swizzleYZ(mat4.mul(mat4.translation(vert), controlPointModel)));
    }
    this.points = new RenderMeshInstanced(this,
      controlPointVerts, controlPointVerts, controlPointIndices, transforms, this.accumulatedSubSelection, true);
    INSTANCE.getScene().addRenderMeshInstanced(this.points);


    this.indices = [];
    for (let i = 0; i < this.u; i++) {
      for (let j = 0; j < this.v - 1; j++) {
        this.indices.push(i * this.v + j, i * this.v + j + 1);
      }
    }
    for (let i = 0; i < this.u - 1; i++) {
      for (let j = 0; j < this.v; j++) {
        this.indices.push(i * this.v + j, (i + 1) * this.v + j);
      }
    }

    this.renderLines = new RenderLines(this, this.verts, this.indices, this.accumulatedSubSelection);
    INSTANCE.getScene().addRenderLines(this.renderLines);

    this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
    this.lineBBH = new LineBoundingBoxHeirarchy(this, this.verts, this.indices);

    this.hide();

  }

  public showControls(on: boolean): void {
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
    return "Control cage 2d";
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    let intersection: Intersection | null = this.pointBBH.almostIntersect(ray, 10);
    if (intersection === null) {
      intersection = this.lineBBH.almostIntersect(ray, 10);
      if (intersection !== null) {
        intersection.objectSubID += this.u * this.v;
      }
    }
    return intersection;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    alert("todo within frustum");
    return false;
  }

  public addToSubSelection(subID: number): void {
    if (subID >= this.u * this.v) {
      subID -= this.u * this.v;
      // Line Sub ID
      if (!this.segmentSubSelection[subID]) {
        this.segmentSubSelection[subID] = true;
        this.subSelectedSegmentCount++;
        this.segmentSelectionChanged(subID);
      }
    } else {
      // Point Sub ID
      if (!this.vertexSubSelection[subID]) {
        console.log("subSelect vert", subID);
        this.vertexSubSelection[subID] = true;
        this.subSelectedVertCount++;
        this.vertSelectionChanged(subID);
      }
    }
  }

  public removeFromSubSelection(subID: number): void {
    if (subID >= this.u * this.v) {
      subID -= this.u * this.v;
      // Line Sub ID
      if (this.segmentSubSelection[subID]) {
        this.segmentSubSelection[subID] = false;
        this.subSelectedSegmentCount--;
        this.segmentSelectionChanged(subID);
      }
    } else {
      // Point Sub ID
      if (this.vertexSubSelection[subID]) {
        this.vertexSubSelection[subID] = false;
        this.subSelectedVertCount--;
        this.vertSelectionChanged(subID);
      }
    }
  }


  private vertSelectionChanged(id: number): void {
    // modify accumulated accordingly
    const selected: boolean = this.vertexSubSelection[id];
    if (selected) {
      this.accumulatedSubSelection[id] = true;
    } else {
      const vertRow: number = Math.floor(id / this.v);
      const vertCol: number = id % this.v;
      // left
      if (vertCol !== 0 && this.segmentSubSelection[id - vertRow - 1]) {
        this.accumulatedSubSelection[id] = true;
      }
      // right
      else if (vertCol !== this.v - 1 && this.segmentSubSelection[id - vertRow]) {
        this.accumulatedSubSelection[id] = true;
      }
      // up
      else if (vertRow !== 0 && this.segmentSubSelection[id - this.v + this.u * (this.v - 1)]) {
        this.accumulatedSubSelection[id] = true;
      }
      // down
      else if (vertCol !== this.u - 1 && this.segmentSubSelection[id + this.u * (this.v - 1)]) {
        this.accumulatedSubSelection[id] = true;
      }
      else {
        this.accumulatedSubSelection[id] = false;
      }
    }


    this.onSubSelectionUpdated();
  }

  private segmentSelectionChanged(id: number): void {

    const selected = this.segmentSubSelection[id];

    let vert1Index: number;
    let vert2Index: number;
    if (id >= this.u * (this.v - 1)) {
      // vertical
      id -= this.u * (this.v - 1);
      vert1Index = id;
      vert2Index = id + this.v;
    } else {
      // horizontal
      const vertRow: number = Math.floor(id / (this.v - 1))
      vert1Index = id + vertRow + 1;
      vert2Index = id + vertRow;
    }

    if (selected || this.vertexSubSelection[vert1Index] || this.vertexSubSelection[vert2Index]) {
      this.accumulatedSubSelection[vert1Index] = true;
      this.accumulatedSubSelection[vert2Index] = true;
    } else {
      this.accumulatedSubSelection[vert1Index] = false;
      this.accumulatedSubSelection[vert2Index] = false;
    }
    this.onSubSelectionUpdated();

  }

  private onSubSelectionUpdated(): void {
    this.points.updateSubSelection(this.vertexSubSelection);
    this.renderLines.updateSubSelection(this.accumulatedSubSelection);
  }

  public isSubSelected(subID: number): boolean {
    if (subID >= this.u * this.v) {
      subID -= this.u * this.v;
      // Line Sub ID
      return this.segmentSubSelection[subID];
    } else {
      // Point Sub ID
      return this.vertexSubSelection[subID];
    }
  }

  public clearSubSelection(): void {
    if (this.hasSubSelection()) {
      this.accumulatedSubSelection = this.accumulatedSubSelection.map(() => { return false; });
      this.vertexSubSelection = this.vertexSubSelection.map(() => { return false; });
      this.segmentSubSelection = this.segmentSubSelection.map(() => { return false; });
      this.onSubSelectionUpdated();
    }
  }

  public onSelectionMoved(): void {
    this.parent!.onSelectionMoved();
  }

  public getSubSelectionBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    if (!this.hasSubSelection()) {
      console.log("early return");
      return res;
    }
    for (let i = 0; i < this.u * this.v; i++) {
      if (this.accumulatedSubSelection[i]) {
        res.addVec3(vec3.transformMat4(this.verts[i], model));
      }
    }
    return res;
  }

  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
    INSTANCE.getScene().removeMeshInstanced(this.points);
  }

  public getVertsSubSelectionTransformed(): Vec3[][] {

    var t: Mat4 = INSTANCE.getMover().getTransform();
    const model: Mat4 = this.getModelRecursive();
    t = mat4.mul(mat4.mul(mat4.inverse(model), t), model);

    const transformed: Vec3[][] = [];
    for (let i = 0; i < this.u; i++) {
      const temp: Vec3[] = [];
      for (let j = 0; j < this.v; j++) {
        const idx: number = i * this.v + j;
        if (this.accumulatedSubSelection[idx]) {
          temp.push(vec3.transformMat4(this.verts[idx], t));
        } else {
          temp.push(vec3.clone(this.verts[idx]));
        }
      }
      transformed.push(temp);
    }

    const flattened: Vec3[] = [];
    for (const l of transformed) for (const v of l) flattened.push(v);

    this.updatePoints(flattened);
    this.renderLines.updateVerts(flattened);
    return transformed;

  }

  public updatePoints(points?: Vec3[]) {
    if (points === undefined) points = this.verts;
    const model: Mat4 = this.getModelRecursive();
    const translation: Vec3 = mat4.getTranslation(model);
    const modelNoTranslation: Mat4 = mat4.mul(mat4.translation(vec3.scale(translation, -1)), model);
    this.points.updateTransforms(points.map((pos: Vec3) => {
      return swizzleYZ(mat4.mul(mat4.translation(pos), mat4.mul(mat4.inverse(modelNoTranslation), controlPointModel)));
    }));
  }

  public bakeSelectionTransform(): void {
    if (this.isSelected()) {
      this.updatePoints(this.verts);
    } else if (this.hasSubSelection()) {

      var t: Mat4 = INSTANCE.getMover().getTransform();
      const model: Mat4 = this.getModelRecursive();
      t = mat4.mul(mat4.mul(mat4.inverse(model), t), model);

      for (let i = 0; i < this.u * this.v; i++) {
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

  public hasSubSelection(): boolean {
    return this.subSelectedSegmentCount > 0 ||
      this.subSelectedVertCount > 0;
  }

  public clone(): Geometry {
    const controlPoints: Vec3[][] = [];
    for (let i = 0; i < this.u; i++) {
      const temp: Vec3[] = [];
      for (let j = 0; j < this.v; j++) {
        temp.push(this.verts[i * this.v + j]);
      }
      controlPoints.push(temp);
    }
    return new ControlCage2D(this.parent, controlPoints, this.model, this.materialName);
  }

}
