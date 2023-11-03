import { Mat4, mat4, vec4, Vec4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Geometry } from "../geometry/geometry";
import { Material, MaterialName } from "../materials/material";
import { RenderID } from "../scene/scene";
import { swizzleYZ } from "../utils/math";

export class RenderLines {

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
  private bindGroup!: GPUBindGroup;

  private modelBuffer: GPUBuffer;

  private flags: Int32Array;
  private flagsBuffer: GPUBuffer;

  private indexCount: number;
  private id: RenderID;

  constructor(
    private parent: Geometry,
    vertices: Float32Array,
    indices: Int32Array,
    private model: Mat4 = mat4.identity(),
    private material: MaterialName = "default"
  ) {

    this.id = INSTANCE.getScene().generateNewRenderID();

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

    //mvp
    this.modelBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "mvp",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.flagsBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "render lines flags buffer",
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.flags = new Int32Array([0]);

  }

  public getID(): RenderID {
    return this.id;
  }

  public draw(pass: GPURenderPassEncoder): void {
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount);
  }

  public update(): void {
    this.updateFlags();
    this.updateModel();
    this.updateBindGroup();
  }

  private updateFlags(): void {
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.flagsBuffer, 0, this.flags);
  }

  private updateModel(): void {
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.modelBuffer, 0, <Float32Array>this.model);
  }

  private updateBindGroup(): void {
    const mat: Material = INSTANCE.getMaterialManager().getMaterial(this.material)!;
    this.bindGroup = INSTANCE.getRenderer().getDevice().createBindGroup({
      label: "bind group",
      layout: INSTANCE.getRenderer().getBindGroupLayout(),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.modelBuffer },
        }, {
          binding: 1,
          resource: { buffer: this.parent.getColorBuffer() },
        }, {
          binding: 2,
          resource: { buffer: this.flagsBuffer }
        }
      ]
    });
  }

  public static getVertexBufferLayout(): GPUVertexBufferLayout {
    return RenderLines.vertexBufferLayout;
  }

}
