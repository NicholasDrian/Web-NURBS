import { vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";

export type MaterialName = string;

export class Material {

  private buffer: GPUBuffer;

  constructor(
    private name: string,
    private color: Vec4 = vec4.create(0.5, 0.5, 0.5, 1),
  ) {

    this.buffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "color buffer for material " + this.name,
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.updateBuffer();

  }

  public updateColor(color: Vec4): void {
    this.color = color;
    this.updateBuffer();
  }

  private updateBuffer(): void {
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.buffer, 0, <Float32Array>this.color);
  }

  public getColorBuffer(): GPUBuffer {
    return this.buffer;
  }

  public getName(): MaterialName {
    return this.name;
  }

  public getColor(): Vec4 | null {
    return this.color;
  }


}
