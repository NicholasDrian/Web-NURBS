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
  private subSelectionBuffer: GPUBuffer;
  private indexCount: number;


  constructor(
    parent: Geometry,
    vertices: Float32Array,
    indices: Int32Array,
    subSelection: boolean[]
  ) {

    super(parent);

    // vertex
    this.vertexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "vertex buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertices);

    // index
    this.indexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "index buffer",
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.indexBuffer, 0, indices);
    this.indexCount = indices.length;

    // sub selection
    const subSelectionList: number[] = [];
    for (let i = 0; i < subSelection.length; i++) {
      if (i % 32 === 0) { subSelectionList.push(0); }
      if (subSelection[i]) { subSelectionList[i / 32] |= 1 << (i % 32); }
    }
    const subSelectionArray: Int32Array = new Int32Array(subSelectionList);
    this.subSelectionBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "sub selection buffer",
      size: subSelectionArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.subSelectionBuffer, 0, subSelectionArray);

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
