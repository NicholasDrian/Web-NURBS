import { Mat4, mat4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"

export class RenderPoints {

  private static readonly vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 4,
    attributes: [
      { // location
        format: "float32",
        offset: 0,
        shaderLocation: 0,
      }
    ]
  };

  private vertexBuffer: GPUBuffer;
  private bindGroup!: GPUBindGroup;
  private mvp: Float32Array;
  private mvpBuffer: GPUBuffer;
  private colorBuffer: GPUBuffer;
  private vertexCount: number;

  constructor(
    vertices: Float32Array,
    color: [number, number, number, number],
    private model: Mat4 = mat4.identity()
  ) {

    // vertex
    this.vertexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "vertex buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertices);
    this.vertexCount = vertices.length;

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
    this.setColor(color);
  }

  public draw(pass: GPURenderPassEncoder): void {
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(this.vertexCount);
  }

  public setColor(color: [number, number, number, number]) {
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.colorBuffer, 0, new Float32Array(color));
  }

  public update(): void {
    this.updateMVP();
    this.updateBindGroup();
  }

  private updateMVP(): void {
    mat4.mul(this.model, INSTANCE.getScene().getCamera().getViewProj(), this.mvp);
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.mvpBuffer, 0, this.mvp);
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

  public static getVertexBufferLayout(): GPUVertexBufferLayout {
    return RenderPoints.vertexBufferLayout;
  }

}
