import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { RenderMesh } from "../render/renderMesh";
import { RenderID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";



export class Mesh extends Geometry {

  private renderMesh: RenderID;

  constructor(
    private verts: Vec3[],
    private normals: Vec3[],
    private indices: number[],
    private model: Mat4 = mat4.identity()
  ) {
    super();
    const vertexBuffer: number[] = [];
    for (let i = 0; i < verts.length; i++) {
      vertexBuffer.push(...verts[i], 1, ...normals[i], 0);
    }
    this.renderMesh = INSTANCE.getScene().addRenderMesh(new RenderMesh(
      new Float32Array(vertexBuffer),
      new Int32Array(this.indices),
      new Float32Array([0, 1, 0, 1]),
      model
    ));
  }

  public getModel(): Mat4 {
    return this.model;
  }

  public destroy(): void {
    INSTANCE.getScene().removeMesh(this.renderMesh);
  }

  public getBoundingBox(): BoundingBox {
    const bb: BoundingBox = new BoundingBox();
    this.verts.forEach((vert: Vec3) => {
      bb.addVec3(vec3.transformMat4(vert, this.model));
    });
    return bb;
  }

}

