import { Vec3, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";

enum ShadingMode {
  Default,
  Ghosted,
}

export class GlobalUniforms {

  private cameraPositionBuffer: GPUBuffer;
  private cameraViewProjBuffer: GPUBuffer;
  private selectionTransformBuffer: GPUBuffer;
  private resolutionBuffer: GPUBuffer;

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
    });
    this.selectionTransformBuffer = this.device.createBuffer({
      label: "selection buffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.resolutionBuffer = this.device.createBuffer({
      label: "resolutionBuffer",
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
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
        }, {
          binding: 2, // selection transform
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }, {
          binding: 3, // resolution buffer
          visibility: GPUShaderStage.FRAGMENT,
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
        }, {
          binding: 1,
          resource: { buffer: this.cameraViewProjBuffer },
        }, {
          binding: 2,
          resource: { buffer: this.selectionTransformBuffer }
        }, {
          binding: 3,
          resource: { buffer: this.resolutionBuffer }
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
    this.device.queue.writeBuffer(this.selectionTransformBuffer, 0, <Float32Array>INSTANCE.getMover().getTransform())

    const resolutionArray: Float32Array = new Float32Array([window.innerWidth, window.innerHeight]);
    this.device.queue.writeBuffer(this.resolutionBuffer, 0, resolutionArray);
  }

  public bind(pass: GPURenderPassEncoder): void {
    pass.setBindGroup(1, this.bindGroup);
  }



}
