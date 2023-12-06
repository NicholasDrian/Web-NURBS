import { pbkdf2 } from "crypto";
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderMesh } from "../render/renderMesh";
import { cloneVec3List } from "../utils/clone";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { MeshBoundingBoxHeirarchy } from "./meshBoundingBoxHeirarchy";
import { Ray } from "./ray";



export class Mesh extends Geometry {

  private renderMesh: RenderMesh;
  private boundingBoxHeirarchy: MeshBoundingBoxHeirarchy;
  private subSelection: boolean[];
  private subSelectionCount: number;

  constructor(
    parent: Geometry | null,
    private verts: Vec3[],
    private normals: Vec3[],
    private indices: number[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null,
    constantScreenSpaceSize: boolean = false
  ) {
    super(parent, model, material);

    this.subSelection = [];
    this.subSelectionCount = 0;
    for (let i = 0; i < this.indices.length / 3; i++) {
      this.subSelection.push(false);
    }

    this.renderMesh = new RenderMesh(this, this.verts, this.normals, this.indices, this.subSelection, constantScreenSpaceSize);
    INSTANCE.getScene().addRenderMesh(this.renderMesh);
    this.boundingBoxHeirarchy = new MeshBoundingBoxHeirarchy(this, this.verts, this.indices);
  }

  public addToSubSelection(...subIDs: number[]): void {
    for (const subID of subIDs) {
      if (!this.subSelection[subID]) {
        this.subSelection[subID] = true;
        this.subSelectionCount++;
      }
    }
    this.renderMesh.updateSubSelection(this.subSelection);
  }

  public removeFromSubSelection(...subIDs: number[]): void {
    for (const subID of subIDs) {
      if (this.subSelection[subID]) {
        this.subSelection[subID] = false;
        this.subSelectionCount--;
      }
    }
    this.renderMesh.updateSubSelection(this.subSelection);
  }

  public isSubSelected(subID: number): boolean {
    return this.subSelection[subID];
  }

  public hasSubSelection(): boolean {
    return this.subSelectionCount > 0;
  }

  public clearSubSelection(): void {
    this.subSelection.map(() => { return false; });
    this.renderMesh.updateSubSelection(this.subSelection);
  }

  public getSubSelectionBoundingBox(): BoundingBox {
    return new BoundingBox();
    // TODO: sub seledction
  }

  public onSelectionMoved(): void {
    // TODO: sub seledction
  }

  public bakeSelectionTransform(): void {
    this.model = mat4.mul(INSTANCE.getMover().getTransform(), this.model);
    // TODO: sub seledction
  }

  public showControls(on: boolean): void {
    alert("todo");
  }

  public setConstantScreenSpaceSize(on: boolean) {
    this.renderMesh.setConstantScreenSpaceSize(on);
  }

  public clone(): Geometry {
    return new Mesh(this.parent, cloneVec3List(this.verts), cloneVec3List(this.normals), [...this.indices], mat4.clone(this.model), this.materialName);
  }

  public delete(): void {
    INSTANCE.getScene().removeMesh(this.renderMesh);
  }

  public getVerts(): Vec3[] {
    return this.verts;
  }

  public getIndices(): number[] {
    return this.indices;
  }

  public intersect(ray: Ray, sub: boolean): Intersection | null {
    if (this.isHidden()) return null;
    return this.boundingBoxHeirarchy.firstIntersection(ray);
  }

  public override getTypeName(): string {
    return "Mesh";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    return this.boundingBoxHeirarchy.isWithinFrustum(frustum, inclusive);
  }

  public getBoundingBox(): BoundingBox {
    const bb: BoundingBox = new BoundingBox();
    const model: Mat4 = this.getModelRecursive();
    this.verts.forEach((vert: Vec3) => {
      bb.addVec3(vec3.transformMat4(vert, model));
    });
    return bb;
  }

}

