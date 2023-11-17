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
    vertices: Float32Array,
    indices: Int32Array,
  ) {
    super(parent);

    //vertex
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
