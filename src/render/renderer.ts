
import triangleShader from "./shaders/triangleShader.wgsl";
import lineShader from "./shaders/lineShader.wgsl";
import pointShader from "./shaders/pointShader.wgsl";
import instancedTriangleShader from "./shaders/instancedTriangleShader.wgsl"
import { Scene } from "../scene/scene"
import { Pipeline, PipelinePrimitive } from "./pipeline"
import { INSTANCE } from "../cad";

const compatibilityCheck: HTMLElement = <HTMLElement>document.getElementById("compatibility-check");

export class Renderer {

  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private canvas!: HTMLCanvasElement;
  private canvasFormat!: GPUTextureFormat;

  private triangleShaderModule!: GPUShaderModule;
  private lineShaderModule!: GPUShaderModule;
  private pointShaderModule!: GPUShaderModule;
  private instancedTriangleShaderModule!: GPUShaderModule;

  private depthTexture!: GPUTexture;
  private renderTarget!: GPUTexture;
  private bindGroupLayout!: GPUBindGroupLayout;
  private bindGroupLayoutInstanced!: GPUBindGroupLayout;

  private trianglePipeline!: Pipeline;
  private linePipeline!: Pipeline;
  private pointPipeline!: Pipeline;
  private instancedTrianglePipeline!: Pipeline;

  private clearColor: [number, number, number, number];

  constructor() {
    this.clearColor = [0.1, 0.1, 0.1, 1.0];
  }

  public getDevice(): GPUDevice {
    return this.device;
  }

  public getBindGroupLayout(): GPUBindGroupLayout {
    return this.bindGroupLayout;
  }

  public getBindGroupLayoutInstanced(): GPUBindGroupLayout {
    return this.bindGroupLayoutInstanced;
  }

  public setClearColor(color: [number, number, number, number]): void {
    this.clearColor = color;
  }

  async init() {


    await this.createDevice();
    this.createResources();
    this.createPipelines();
    this.updateScreenSize();

  }

  private async createDevice() {

    if (!navigator.gpu) {
      alert("Your browser / computer does not support WebGPU.");
      compatibilityCheck.innerText = "This browser does not support WebGPU. Check here for a list of supported browsers https://caniuse.com/webgpu";
      return;
    }

    var adapter: GPUAdapter | null;
    try {
      adapter = await navigator.gpu.requestAdapter();
    } catch (error) {
      console.log(error);
    }

    if (adapter! == null) {
      alert("Your browser / computer does not support WebGPU.");
      compatibilityCheck.innerText = "No valid gpu adapter. Check here for a list of supported browsers https://caniuse.com/webgpu";
      return;
    }

    this.device = <GPUDevice>await adapter.requestDevice();
    this.canvas = <HTMLCanvasElement>document.getElementById("screen");
    this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");


    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.canvasFormat,
    });

  }

  private createResources() {


    this.triangleShaderModule = this.device.createShaderModule({
      label: "triangle shader module",
      code: triangleShader,
    });

    this.lineShaderModule = this.device.createShaderModule({
      label: "line shader module",
      code: lineShader,
    });

    this.pointShaderModule = this.device.createShaderModule({
      label: "point shader module",
      code: pointShader,
    });
    this.instancedTriangleShaderModule = this.device.createShaderModule({
      label: "instanced triangle shader module",
      code: instancedTriangleShader,
    })

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: "bind group layout",
      entries: [
        {
          binding: 0, // mvp
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }, {
          binding: 1, // color
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        }
      ]
    });
    this.bindGroupLayoutInstanced = this.device.createBindGroupLayout({
      label: "bind group layout instanced",
      entries: [
        {
          binding: 0, // mvp
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }, {
          binding: 1, // color
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        }, {
          binding: 2, // transform buffer
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        }
      ]
    });

    this.updateScreenSize();

  }


  private createPipelines() {
    this.trianglePipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      this.bindGroupLayout,
      this.triangleShaderModule,
      PipelinePrimitive.Triangle);
    this.linePipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      this.bindGroupLayout,
      this.lineShaderModule,
      PipelinePrimitive.Line);
    this.pointPipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      this.bindGroupLayout,
      this.pointShaderModule,
      PipelinePrimitive.Point);
    this.instancedTrianglePipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      this.bindGroupLayoutInstanced,
      this.instancedTriangleShaderModule,
      PipelinePrimitive.Triangle);
  }

  public updateScreenSize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      sampleCount: 4,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.renderTarget = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      sampleCount: 4,
      format: this.canvasFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
  }

  async render(scene: Scene) {

    // TODO: Factor this stuff out of main loop
    const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
    const pass: GPURenderPassEncoder = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.renderTarget.createView(),
          resolveTarget: this.context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: this.clearColor,
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    });

    var drawCalls: number = 0;

    pass.setPipeline(this.trianglePipeline.get());
    for (let mesh of scene.getAllMeshes()) {
      mesh.draw(pass);
      drawCalls++;
    };

    pass.setPipeline(this.linePipeline.get());
    for (let lines of scene.getAllLines()) {
      lines.draw(pass);
      drawCalls++;
    };

    pass.setPipeline(this.pointPipeline.get());
    for (let points of scene.getAllPoints()) {
      points.draw(pass);
      drawCalls++;
    }

    pass.setPipeline(this.instancedTrianglePipeline.get());
    for (let mesh of scene.getAllMeshesInstanced()) {
      mesh.draw(pass);
      drawCalls++;
    }

    INSTANCE.getStats().setDrawCalls(drawCalls);

    pass.end();
    const commandBuffer = encoder.finish();
    this.device.queue.submit([commandBuffer]);

    await this.device.queue.onSubmittedWorkDone();

  }

}



