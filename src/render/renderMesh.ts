import { INSTANCE } from "../cad"
import { mat4, Mat4 } from "wgpu-matrix"

export class RenderMesh {

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

  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private bindGroup!: GPUBindGroup;
  private mvp: Float32Array;
  private mvpBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private indexCount: number;

  constructor(
    vertices: Float32Array,
    indices: Int32Array,
    color: Float32Array,
    private model: Mat4) {

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

    //mvp
    this.mvpBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "mvp",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.mvp = new Float32Array(16);

    //color
    this.colorBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "color buffer",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.colorBuffer, 0, color);

  }

  public draw(pass: GPURenderPassEncoder): void {
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount);
  }


  public update(): void {
    this.updateMVP();
    this.updateBindGroup();
  }

  private updateMVP(): void {
    mat4.mul(this.model, INSTANCE.getScene().getCamera().getViewProj(), this.mvp);
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.mvpBuffer, 0, this.mvp.buffer);
  }

  private updateBindGroup(): void {
    this.bindGroup = INSTANCE.getRenderer().getDevice().createBindGroup({
      label: "bind group",
      layout: INSTANCE.getRenderer().getBindGroupLayout(),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.mvpBuffer },
        }, {
          binding: 1,
          resource: { buffer: this.colorBuffer },
        }
      ]
    });
  }

  static getVertexBufferLayout(): GPUVertexBufferLayout {
    return this.vertexBufferLayout;
  }

}
