import { Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";

export type MaterialName = string;

export class Material {

  // regular color
  private diffuseColorBuffer: GPUBuffer | null = null;

  constructor(
    private name: string,
    private color: Vec4 | null,
  ) {
    this.updateColor();
  }

  private updateColor() {
    if (this.color) {
      this.diffuseColorBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
        label: "color buffer for material " + this.name,
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.diffuseColorBuffer, 0, <Float32Array>this.color);
    } else {
      this.diffuseColorBuffer = null;
    }
  }

  public getColorBuffer(): GPUBuffer | null {
    return this.diffuseColorBuffer;
  }

  public getName(): MaterialName {
    return this.name;
  }

  public getColor(): Vec4 | null {
    return this.color;
  }


}
