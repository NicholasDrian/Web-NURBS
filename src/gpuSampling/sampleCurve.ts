import { Vec4 } from "wgpu-matrix";
import curveSampler from "./curveSampler.wgsl"

const SAMPLES_PER_EDGE: number = 10;

export class CurveSampler {

  private device!: GPUDevice;
  private shaderModule!: GPUShaderModule;
  private bindGroupLayout!: GPUBindGroupLayout;

  private uniformBuffer!: GPUBuffer;

  private pipeline!: GPUComputePipeline;

  constructor() { }

  public async init(): Promise<void> {
    await this.setupDevice();
    this.setupResources();
    this.setupPipeline();
  }

  private async setupDevice(): Promise<void> {
    const adapter = await navigator.gpu.requestAdapter();
    this.device = <GPUDevice>await adapter?.requestDevice();
  }

  private setupResources(): void {
    this.shaderModule = this.device.createShaderModule({
      label: "curve sampler compute shader",
      code: curveSampler,
    });
    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: "curve samplere bind group layout",
      entries: [
        {
          binding: 0, // Params Uniform
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" }
        }, {
          binding: 1, // Constrols
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        }, {
          binding: 2, // Knots
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" }
        }, {
          binding: 3, // Samples
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" }
        }
      ]
    });
    this.uniformBuffer = this.device.createBuffer({
      label: "curve sampler uniform buffer",
      size: 8, // control count, degree
      usage: GPUBufferUsage.UNIFORM
    });
  }

  private setupPipeline(): void {

    const layout: GPUPipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.bindGroupLayout
      ]
    });
    this.pipeline = this.device.createComputePipeline({ // probably want to change this to async...
      label: "curve sampler pipeline",
      layout: layout,
      compute: {
        module: this.shaderModule,
        entryPoint: "main",
        constants: { // TODO:
          // blockSize: 1,
        }
      }
    });
  }


  public async sampleCurve(weightedControls: Vec4[], knots: number[], degree: number): Promise<GPUBuffer> {

    this.device.queue.writeBuffer(this.uniformBuffer, 0, new Uint32Array([weightedControls.length, degree]));

    const sampleCount: number = weightedControls.length * (SAMPLES_PER_EDGE - 1) + 1;

    const samples: GPUBuffer = this.device.createBuffer({
      label: "curve sampler output buffer",
      size: sampleCount * 16,
      usage: GPUBufferUsage.STORAGE
    });

    const controlPointList: number[] = [];
    for (const control of weightedControls) controlPointList.push(...control);
    const controlPointArray: Float32Array = new Float32Array(controlPointList);
    const controlPointBuffer: GPUBuffer = this.device.createBuffer({
      label: "curve sample control point buffer",
      size: controlPointArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.MAP_WRITE
    });
    this.device.queue.writeBuffer(controlPointBuffer, 0, controlPointArray);

    const knotArray: Float32Array = new Float32Array(knots);
    const knotBuffer: GPUBuffer = this.device.createBuffer({
      label: "curve sample knot buffer",
      size: knotArray.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.MAP_WRITE
    });
    this.device.queue.writeBuffer(knotBuffer, 0, knotArray);

    const bindGroup: GPUBindGroup = this.device.createBindGroup({
      label: "curve sampler bind group",
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        }, {
          binding: 1,
          resource: { buffer: controlPointBuffer },
        }, {
          binding: 2,
          resource: { buffer: knotBuffer },
        }, {
          binding: 3,
          resource: { buffer: samples },
        }
      ],
    });

    const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
    const computePass: GPUComputePassEncoder = encoder.beginComputePass();

    computePass.setPipeline(this.pipeline);
    computePass.setBindGroup(0, bindGroup);

    computePass.dispatchWorkgroups(sampleCount, 0, 0);

    computePass.end();

    this.device.queue.submit([encoder.finish()]);

    await this.device.queue.onSubmittedWorkDone();

    return samples;
  }
}
