import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderMeshInstanced } from "../render/renterMeshInstanced";
import { cloneVec3List } from "../utils/clone";
import { swizzleYZ } from "../utils/math";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { PointBoundingBoxHeirarchy } from "./pointBoundingBoxHeirarchy";
import { Ray } from "./ray";

export const POINT_VERTS: Vec3[] = [
  vec3.create(1, 0, 0),
  vec3.create(0, 1, 0),
  vec3.create(0, 0, 1),
  vec3.create(-1, 0, 0),
  vec3.create(0, -1, 0),
  vec3.create(0, 0, -1),
];

export const POINT_INDICES: number[] = [
  0, 1, 2,
  0, 2, 4,
  0, 4, 5,
  0, 5, 1,

  3, 1, 5,
  3, 5, 4,
  3, 4, 2,
  3, 2, 1,
];

export const POINT_MODEL: Mat4 = mat4.uniformScaling(0.01);

const controlPointModel: Mat4 = mat4.uniformScaling(0.01);

export class Points extends Geometry {

  private pointBBH: PointBoundingBoxHeirarchy;
  private subSelection: boolean[];
  private subSelectionCount: number;
  private points: RenderMeshInstanced;

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

    const transforms: Mat4[] = [];
    for (const vert of this.verts) {
      transforms.push(swizzleYZ(mat4.mul(mat4.translation(vert), POINT_MODEL)));
    }

    this.points = new RenderMeshInstanced(
      this,
      POINT_VERTS,
      POINT_VERTS,
      POINT_INDICES,
      transforms,
      this.subSelection,
      true);
    INSTANCE.getScene().addRenderMeshInstanced(this.points);
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
      this.points.updateSubSelection(this.subSelection);
    }
  }

  public removeFromSubSelection(subID: number): void {
    if (this.subSelection[subID]) {
      this.subSelectionCount--;
      this.subSelection[subID] = false;
      this.points.updateSubSelection(this.subSelection);
    }
  }

  public clearSubSelection(): void {
    for (let i = 0; i < this.subSelection.length; i++) {
      this.subSelection[i] = false;
    }
    this.points.updateSubSelection(this.subSelection);
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

    if (this.subSelectionCount > 0) {
      const subSelectionTransform: Mat4 = INSTANCE.getMover().getTransform();
      const newTranslations: Mat4[] = [];
      for (let i = 0; i < this.verts.length; i++) {
        if (this.subSelection[i]) {
          newTranslations.push(mat4.translation(
            vec3.transformMat4(this.verts[i], subSelectionTransform))
          );
        } else {
          newTranslations.push(mat4.translation(this.verts[i]));
        }
      }
      this.points.updateTransforms(newTranslations);
    } else {
      const model: Mat4 = this.getModelRecursive();
      const translation: Vec3 = mat4.getTranslation(model);
      const modelNoTranslation: Mat4 = mat4.mul(mat4.translation(vec3.scale(translation, -1)), model);
      this.points.updateTransforms(this.verts.map((pos: Vec3) => {
        return swizzleYZ(mat4.mul(mat4.translation(pos), mat4.mul(mat4.inverse(modelNoTranslation), POINT_MODEL)));
      }));
    }
  }

  public bakeSelectionTransform(): void {

    if (this.subSelectionCount > 0) {
      const subSelectionTransform: Mat4 = INSTANCE.getMover().getTransform();
      const newVerts: Vec3[] = [];
      for (let i = 0; i < this.verts.length; i++) {
        let newVert: Vec3;
        if (this.subSelection[i]) {
          newVert = vec3.transformMat4(this.verts[i], subSelectionTransform);
        } else {
          newVert = this.verts[i];
        }
        newVerts.push(newVert);
      }
      this.verts = newVerts;
      this.pointBBH = new PointBoundingBoxHeirarchy(this, this.verts);
    } else {
      const model: Mat4 = this.getModelRecursive();
      const translation: Vec3 = mat4.getTranslation(model);
      const modelNoTranslation: Mat4 = mat4.mul(mat4.translation(vec3.scale(translation, -1)), model);
      this.points.updateTransforms(this.verts.map((pos: Vec3) => {
        return swizzleYZ(mat4.mul(mat4.translation(pos), mat4.mul(mat4.inverse(modelNoTranslation), POINT_MODEL)));
      }));
    }
  }

  public delete(): void {
    INSTANCE.getScene().removeMeshInstanced(this.points);
  }

  public clone(): Geometry {
    return new Points(this.parent, cloneVec3List(this.verts), mat4.clone(this.model), this.materialName);
  }

}
