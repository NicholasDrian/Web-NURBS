import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";

export class ControlCage2D extends Geometry {

  constructor(
    parent: Geometry | null,
    private controlPoints: Vec3[][],
    model: Mat4 = mat4.identity(),
    materialName: MaterialName | null = null
  ) {
    super(parent, model, materialName);
  }

  public getBoundingBox(): BoundingBox {
    const res: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    for (const v of this.controlPoints) {
      for (const p of v) {
        res.addVec3(vec3.transformMat4(p, model));
      }
    }
    return res;
  }

  public getTypeName(): string {
    return "Control cage 2d";
  }
  public intersect(ray: Ray): Intersection | null {
    throw new Error("Method not implemented.");
  }
  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    throw new Error("Method not implemented.");
  }
  public addToSubSelection(subID: number): void {
    throw new Error("Method not implemented.");
  }
  public removeFromSubSelection(subID: number): void {
    throw new Error("Method not implemented.");
  }
  public isSubSelected(subID: number): boolean {
    throw new Error("Method not implemented.");
  }
  public clearSubSelection(): void {
    throw new Error("Method not implemented.");
  }
  public getSubSelectionBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public delete(): void {
    throw new Error("Method not implemented.");
  }
  public clone(): Geometry {
    return new ControlCage2D(this.parent, this.controlPoints, this.model, this.materialName);
  }

}
