import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad"
import { Geometry } from "../geometry/geometry";
import { Renderable } from "./renderable";

export class RenderMesh extends Renderable {

  private static readonly vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 32,
    attributes: [
      { // location
        format: "float32x4",
        offset: 0,
        shaderLocation: 0,
      }, { // normal
        format: "float32x4",
        offset: 16,
        shaderLocation: 1,
      }
    ]
  };

  protected vertexBuffer: GPUBuffer;
  protected indexBuffer: GPUBuffer;
  protected indexCount: number;


  constructor(
    parent: Geometry,
    vertices: Vec3[],
    normals: Vec3[],
    indices: number[],
    subSelection: boolean[],
    constantScreenSize: boolean = false
  ) {
    super(parent, subSelection, constantScreenSize);

    //vertex
    const vertexList: number[] = [];
    for (let i = 0; i < vertices.length; i++) {
      vertexList.push(...vertices[i], 1, ...normals[i], 0);
    }
    const vertexArray: Float32Array = new Float32Array(vertexList);
    this.vertexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "vertex buffer",
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertexArray);

    //index
    const indexArray: Uint32Array = new Uint32Array(indices);
    this.indexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "index buffer",
      size: indexArray.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.indexBuffer, 0, indexArray);
    this.indexCount = indices.length;

  }

  public isOverlay(): boolean {
    return this.parent.isOverlay();
  }

  public draw(pass: GPURenderPassEncoder): void {
    if (this.parent.isHidden()) return;
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount);
  }

  static getVertexBufferLayout(): GPUVertexBufferLayout {
    return this.vertexBufferLayout;
  }

}
