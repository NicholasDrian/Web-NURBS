
import { INSTANCE } from "../cad"
import { mat4, Mat4 } from "wgpu-matrix"
import { Geometry } from "../geometry/geometry";
import { RenderMesh } from "./renderMesh";

export class RenderMeshInstanced extends RenderMesh {

  private instanceCount: number;
  private transformBuffer!: GPUBuffer;
  private instanceBindGroup!: GPUBindGroup;

  constructor(
    parent: Geometry,
    vertices: Float32Array,
    indices: Int32Array,
    transforms: Mat4[]
  ) {
    super(parent, vertices, indices);

    this.instanceCount = transforms.length;

    const transformsList: number[] = [];
    for (let i = 0; i < transforms.length; i++) transformsList.push(...transforms[i]);
    const transformsArray: Float32Array = new Float32Array(transformsList);
    this.transformBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "transform array",
      size: transformsArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.transformBuffer, 0, transformsArray);

  }

  protected override updateBindGroup(): void {

    super.updateBindGroup();
    console.log("here");

    this.instanceBindGroup = INSTANCE.getRenderer().getDevice().createBindGroup({
      label: "bind group instanced mesh",
      layout: INSTANCE.getRenderer().getBindGroupLayoutInstanced(),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.transformBuffer }
        }
      ]
    });
  }

  public override draw(pass: GPURenderPassEncoder): void {
    if (this.parent.isHidden()) return;
    pass.setBindGroup(0, this.bindGroup);
    pass.setBindGroup(2, this.instanceBindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount, this.instanceCount);
  }

}
