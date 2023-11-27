import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad"
import { Geometry } from "../geometry/geometry";
import { Renderable } from "./renderable";

export class RenderLines extends Renderable {

  private static readonly vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 16,
    attributes: [
      { // location
        format: "float32x4",
        offset: 0,
        shaderLocation: 0,
      }
    ]
  };

  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private indexCount: number;


  constructor(
    parent: Geometry,
    vertices: Vec3[],
    indices: number[],
    subSelection: boolean[]
  ) {

    super(parent, subSelection);

    // vertex
    const vertexList: number[] = []
    for (const vert of vertices) {
      vertexList.push(...vert, 1);
    }
    const vertexArray: Float32Array = new Float32Array(vertexList);
    this.vertexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "vertex buffer",
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertexArray);

    // index
    const indexArray: Uint32Array = new Uint32Array(indices);
    this.indexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "index buffer",
      size: indexArray.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.indexBuffer, 0, indexArray);
    this.indexCount = indices.length;

  }

  updateVerts(verts: Vec3[]) {
    const vertexList: number[] = []
    for (const vert of verts) {
      vertexList.push(...vert, 1);
    }
    const vertexArray: Float32Array = new Float32Array(vertexList);
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertexArray);
  }

  public draw(pass: GPURenderPassEncoder): void {
    if (this.parent.isHidden()) return;
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount);
  }

  public static getVertexBufferLayout(): GPUVertexBufferLayout {
    return RenderLines.vertexBufferLayout;
  }

}
