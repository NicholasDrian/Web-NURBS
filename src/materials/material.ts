import { vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";

export type MaterialName = string;

export class Material {

  private buffer: GPUBuffer;

  constructor(
    private name: string,
    private color: Vec4 = vec4.create(0.5, 0.5, 0.5, 1),
    private emissive: Vec4 = vec4.create(0, 0, 0, 0),
    private ambientIntensity: number = 0.1,
    private pseudoDiffuseIntensity: number = 0.7,
    private specularity: number = 8,
    private specularIntensity: number = 0.3,
  ) {

    this.buffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "color buffer for material " + this.name,
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.updateBuffer();

  }

  public updateColor(color: Vec4): void {
    this.color = color;
    this.updateBuffer();
  }

  private updateBuffer(): void {
    const data: Float32Array = new Float32Array([
      ...this.color,
      ...this.emissive,
      this.ambientIntensity,
      this.pseudoDiffuseIntensity,
      this.specularity,
      this.specularIntensity,
    ]);
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.buffer, 0, data);
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
