import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { MaterialName } from "../materials/material";
import { RenderMeshInstanced } from "../render/renterMeshInstanced";
import { RenderID } from "../scene/scene";
import { cloneMat4List, cloneVec3List } from "../utils/clone";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { InstancedMeshBoundingBoxHeirarchy } from "./instancedMeshBoundingBoxHeirarchy";
import { Intersection } from "./intersection";
import { Ray } from "./ray";



export class InstancedMesh extends Geometry {

  private renderMeshInstanced: RenderID;
  private boundingBoxHeirarchy: InstancedMeshBoundingBoxHeirarchy;

  constructor(
    parent: Geometry | null,
    private verts: Vec3[],
    private normals: Vec3[],
    private indices: number[],
    private transforms: Mat4[],
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);

    const vertexBuffer: number[] = [];
    for (let i = 0; i < verts.length; i++) {
      vertexBuffer.push(...verts[i], 1, ...normals[i], 0);
    }
    const renderMeshObj: RenderMeshInstanced = new RenderMeshInstanced(
      this,
      new Float32Array(vertexBuffer),
      new Int32Array(this.indices),
      transforms
    );
    INSTANCE.getScene().addRenderMeshInstanced(renderMeshObj);
    this.renderMeshInstanced = renderMeshObj.getRenderID();

    this.boundingBoxHeirarchy = new InstancedMeshBoundingBoxHeirarchy(this);
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

  public clone(): Geometry {
    return new InstancedMesh(
      this.parent,
      cloneVec3List(this.verts),
      cloneVec3List(this.normals),
      [...this.indices],
      cloneMat4List(this.transforms),
      mat4.clone(this.model),
      this.materialName);
  }

  public override getTypeName(): string {
    return "Instanced Mesh";
  }

  public delete(): void {
    INSTANCE.getScene().removeMeshInstanced(this.renderMeshInstanced);
    INSTANCE.getScene().removeGeometry(this);
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    throw new Error("Method not implemented.");
  }

  public getInstanceCount(): number {
    return this.transforms.length;
  }

  public getVerts(): Vec3[] {
    return this.verts;
  }

  public getIndices(): number[] {
    return this.indices;
  }

  public getBoundingBoxInstance(instance: number): BoundingBox {
    const bb: BoundingBox = new BoundingBox();
    const transform: Mat4 = this.transforms[instance];
    for (let vert of this.verts) {
      bb.addVec3(vec3.transformMat4(vert, transform));
    }
    return bb;
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    return this.boundingBoxHeirarchy.intersect(ray, this.verts);
  }

  public getTransform(intance: number): Mat4 {
    return this.transforms[intance];
  }


  public getBoundingBox(): BoundingBox {
    const boundingBox: BoundingBox = new BoundingBox();
    for (let instance = 0; instance < this.transforms.length; instance++) {
      const transform: Mat4 = mat4.multiply(this.getModelRecursive(), this.transforms[instance]);
      for (let vert of this.verts) {
        boundingBox.addVec3(vec3.transformMat4(transform, vert));
      }
    }
    return boundingBox;
  }

}

