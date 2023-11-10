import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";
import { ObjectID, RenderID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";


export class Line extends Geometry {

  private renderLines!: RenderID;
  private boundingBox!: BoundingBox;

  constructor(
    parent: Geometry | null,
    private start: Vec3,
    private end: Vec3,
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.renderLines = 0;
    this.updateRenderLines();
    this.updateBoundingBox();
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    return ray.almostIntersectLine(this.getID(), this.start, this.end, 10);
  }

  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  private updateRenderLines(): void {
    if (this.renderLines) INSTANCE.getScene().removeLines(this.renderLines);
    const renderLinesObj: RenderLines = new RenderLines(
      this,
      new Float32Array([...this.start, 1.0, ...this.end, 1.0]),
      new Int32Array([0, 1]),
    );
    this.renderLines = renderLinesObj.getRenderID()
    INSTANCE.getScene().addRenderLines(renderLinesObj);
  }

  public override getTypeName(): string {
    return "Line";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    if (inclusive) return frustum.containsLinePartially(this.start, this.end);
    return frustum.containsLineFully(this.start, this.end);
  }

  public delete(): void {
    INSTANCE.getScene().removeLines(this.renderLines);
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
    this.updateBoundingBox();
  }

  public getLength(): number {
    return vec3.distance(this.start, this.end);
  }

  public flip(): void {
    [this.start, this.end] = [this.end, this.start];
  }
  private updateBoundingBox(): void {
    this.boundingBox = new BoundingBox();
    this.boundingBox.addVec3(vec3.transformMat4(this.start, this.getModelRecursive()));
    this.boundingBox.addVec3(vec3.transformMat4(this.end, this.getModelRecursive()));
  }

}
