import { Vec3, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad"
import { Geometry } from "../geometry/geometry";
import { Renderable } from "./renderable";

export class RenderCurve extends Renderable {

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

  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private indexCount!: number;
  private ready: boolean;


  constructor(
    parent: Geometry,
    weightedControls: Vec4[],
    knots: number[],
    degree: number,
    subSelection: boolean[]
  ) {
    super(parent, subSelection);
    this.ready = false;
    this.updateSamples(weightedControls, knots, degree);
  }

  public async updateSamples(weightedControls: Vec4[], knots: number[], degree: number): Promise<void> {

    let vertexCount: number;
    [this.vertexBuffer, vertexCount] = await INSTANCE.getCurveSampler().sampleCurve(weightedControls, knots, degree);

    const indices: number[] = [];
    for (let i = 0; i < vertexCount - 1; i++) { indices.push(i, i + 1); }
    const indexArray: Uint32Array = new Uint32Array(indices);
    this.indexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "index buffer",
      size: indexArray.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.indexBuffer, 0, indexArray);
    this.indexCount = indices.length;

    this.ready = true;

  }

  public draw(pass: GPURenderPassEncoder): void {

    if (this.parent.isHidden() || !this.ready) return;

    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint32");
    pass.drawIndexed(this.indexCount);

  }

  public static getVertexBufferLayout(): GPUVertexBufferLayout {
    return this.vertexBufferLayout;
  }

}
