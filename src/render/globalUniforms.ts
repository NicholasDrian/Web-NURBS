import { Vec3, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";

enum ShadingMode {
  Default,
  Ghosted,
}

export class GlobalUniforms {

  private cameraPositionBuffer: GPUBuffer;
  private cameraViewProjBuffer: GPUBuffer;

  private layout: GPUBindGroupLayout;
  private bindGroup: GPUBindGroup;

  constructor(
    private device: GPUDevice,
  ) {
    this.cameraPositionBuffer = this.device.createBuffer({
      label: "camera position buffer",
      size: 12, // 3 * 4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.cameraViewProjBuffer = this.device.createBuffer({
      label: "camera view proj buffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.layout = this.device.createBindGroupLayout({
      label: "global uniforms layout",
      entries: [
        {
          binding: 0, // camera pos
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        },
        {
          binding: 1, // camer view proj
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      label: "global uniforms",
      layout: this.layout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.cameraPositionBuffer },
        },
        {
          binding: 1,
          resource: { buffer: this.cameraViewProjBuffer },
        }
      ]
    });
  }

  public getLayout(): GPUBindGroupLayout {
    return this.layout;
  }


  public tick(): void {
    this.device.queue.writeBuffer(this.cameraPositionBuffer, 0, <Float32Array>INSTANCE.getScene().getCamera().getPosition());
    this.device.queue.writeBuffer(this.cameraViewProjBuffer, 0, INSTANCE.getScene().getCamera().getViewProj());
  }

  public bind(pass: GPURenderPassEncoder): void {
    pass.setBindGroup(1, this.bindGroup);
  }



}