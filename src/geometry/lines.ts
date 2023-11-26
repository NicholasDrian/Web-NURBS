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

export class Lines extends Geometry {

  private renderLines: RenderLines | null;
  private boundingBox!: BoundingBox;
  private boundingBoxHeirarchy!: LineBoundingBoxHeirarchy;
  private subSelectedSegments!: boolean[];

  constructor(
    private points: Vec3[],
    private indices: number[],
    parent: Geometry | null = null,
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.renderLines = null;
    this.update();
  }

  public addToSubSelection(subID: number): void {
    throw new Error("todo");
  }
  public removeFromSubSelection(subID: number): void {
    throw new Error("todo");
  }
  public isSubSelected(subID: number): boolean {
    throw new Error("todo");
  }
  public clearSubSelection(): void {
    throw new Error("todo");
  }

  public clone(): Geometry {
    return new Lines(cloneVec3List(this.points), [...this.indices], this.parent, mat4.clone(this.model), this.materialName);
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    return this.boundingBoxHeirarchy.almostIntersect(ray, 10);
  }

  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  public getSegmentCount(): number {
    return this.indices.length / 2;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    return this.boundingBoxHeirarchy.isWithinFrustum(frustum, inclusive);
  }

  public override getTypeName(): string {
    return "Lines";
  }

  public override delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines!);
    INSTANCE.getScene().removeGeometry(this);
  }

  private update(): void {
    if (this.renderLines !== null) INSTANCE.getScene().removeLines(this.renderLines);

    this.subSelectedSegments = [];
    for (let i = 0; i < this.indices.length / 2; i++) {
      this.subSelectedSegments.push(false);
    }

    this.renderLines = new RenderLines(this, this.points, this.indices, this.subSelectedSegments);

    INSTANCE.getScene().addRenderLines(this.renderLines);
    this.updateBoundingBox();
    this.boundingBoxHeirarchy = new LineBoundingBoxHeirarchy(this, this.points, this.indices);
  }

  private updateBoundingBox(): void {
    this.boundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    this.points.forEach((point: Vec3) => {
      this.boundingBox.addVec3(vec3.transformMat4(point, model));
    });
  }

}
