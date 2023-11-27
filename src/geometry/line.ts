import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";


export class Line extends Geometry {

  private renderLines!: RenderLines | null;

  constructor(
    parent: Geometry | null,
    private start: Vec3,
    private end: Vec3,
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.renderLines = null;
    this.updateRenderLines();
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
    throw new Error("todo");
  }
  public getSubSelectionBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public onSelectionMoved(): void {
    throw new Error("Method not implemented.");
  }
  public bakeSelectionTransform(): void {
    throw new Error("Method not implemented.");
  }

  public clone(): Geometry {
    return new Line(this.parent, vec3.clone(this.start), vec3.clone(this.end), mat4.clone(this.model), this.materialName);
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    const objectSpaceRay: Ray = Ray.transform(ray, mat4.inverse(this.getModelRecursive()));
    return objectSpaceRay.almostIntersectLine(this, 0, this.start, this.end, 10);
  }

  public getBoundingBox(): BoundingBox {
    const bb: BoundingBox = new BoundingBox();
    bb.addVec3(vec3.transformMat4(this.start, this.getModelRecursive()));
    bb.addVec3(vec3.transformMat4(this.end, this.getModelRecursive()));
    return bb;
  }

  private updateRenderLines(): void {
    if (this.renderLines !== null) INSTANCE.getScene().removeLines(this.renderLines);
    this.renderLines = new RenderLines(this, [this.start, this.end], [0, 1], [false]);
    INSTANCE.getScene().addRenderLines(this.renderLines);
  }

  public override getTypeName(): string {
    return "Line";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {

    if (this.isHidden()) return false;

    frustum.transform(mat4.inverse(this.getModelRecursive()));
    var res: boolean;

    if (inclusive) res = frustum.containsLinePartially(this.start, this.end);
    else res = frustum.containsLineFully(this.start, this.end);

    frustum.transform(this.getModelRecursive());
    return res;
  }

  public override delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines!);
    INSTANCE.getScene().removeGeometry(this);
  }

  public getStart(): Vec3 {
    return this.start;
  }

  public getEnd(): Vec3 {
    return this.end;
  }

  public updateEnd(point: Vec3): void {
    this.end = point;
    this.updateRenderLines();
  }

  public getLength(): number {
    return vec3.distance(this.start, this.end);
  }

  public flip(): void {
    [this.start, this.end] = [this.end, this.start];
  }

}
