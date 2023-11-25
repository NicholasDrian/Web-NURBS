import { Mat4, mat4, Vec3 } from "wgpu-matrix"
import { INSTANCE } from "../cad"
import { Geometry } from "../geometry/geometry";
import { swizzleYZ } from "../utils/math";
import { CONSTANT_SCREEN_SIZE_BIT, HOVER_BIT, SELECTED_BIT } from "./flags";
import { Renderable } from "./renderable";

export class RenderPoints extends Renderable {

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
  private vertexCount: number;

  constructor(
    parent: Geometry,
    points: Vec3[],
    subSelection: boolean[]
  ) {

    super(parent, subSelection);

    // vertex
    const verts: number[] = [];
    for (let i = 0; i < points.length; i++) verts.push(...points[i], 1);
    const vertexArray: Float32Array = new Float32Array(verts);
    this.vertexBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "points vertex buffer",
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.vertexBuffer, 0, vertexArray);
    this.vertexCount = vertexArray.length / 4;

    this.update();
  }


  public draw(pass: GPURenderPassEncoder): void {
    if (this.parent.isHidden()) return;
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(this.vertexCount);
  }

  public static getVertexBufferLayout(): GPUVertexBufferLayout {
    return RenderPoints.vertexBufferLayout;
  }

}
