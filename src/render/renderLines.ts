import { Mat4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Geometry } from "../geometry/geometry";
import { swizzleYZ } from "../utils/math";
import { CONSTANT_SCREEN_SIZE_BIT, HOVER_BIT, SELECTED_BIT } from "./flags";
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
    vertices: Float32Array,
    indices: Int32Array,
  ) {

    super(parent);

    // vertex
    this.vertexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "vertex buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertices);


    //index
    this.indexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "index buffer",
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.indexBuffer, 0, indices);
    this.indexCount = indices.length;
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
