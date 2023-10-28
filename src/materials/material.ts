import { Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";

export type MaterialName = string;

export class Material {

  private colorBuffer: GPUBuffer | null = null;

  constructor(
    public name: string,
    public color: Vec4 | null,
  ) {
    this.updateColor();
  }

  private updateColor() {
    if (this.color) {
      this.colorBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
        label: "color buffer for material " + this.name,
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.colorBuffer, 0, <Float32Array>this.color);
    } else {
      this.colorBuffer = null;
    }
  }

  public getColorBuffer(): GPUBuffer | null {
    return this.colorBuffer;
  }


}
