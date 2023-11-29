
import triangleShader from "./shaders/triangleShader.wgsl";
import lineShader from "./shaders/lineShader.wgsl";
import pointShader from "./shaders/pointShader.wgsl";
import instancedTriangleShader from "./shaders/instancedTriangleShader.wgsl"
import overlayMeshShader from "./shaders/overlayMeshShader.wgsl"
import idShader from "./shaders/idShader.wgsl";
import { Scene } from "../scene/scene"
import { Pipeline, PipelinePrimitive } from "./pipeline"
import { INSTANCE } from "../cad";
import { GlobalUniforms } from "./globalUniforms";

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
  private overlayMeshShaderModule!: GPUShaderModule;
  private idShaderModule!: GPUShaderModule;

  private depthTextureSuperSample!: GPUTexture;
  private depthTexture!: GPUTexture;
  private renderTarget!: GPUTexture;
  private idTexture!: GPUTexture; // rasterize id for mouse picking

  private bindGroupLayout!: GPUBindGroupLayout;
  private bindGroupLayoutInstanced!: GPUBindGroupLayout;

  private globalUniforms!: GlobalUniforms;

  private trianglePipeline!: Pipeline;
  private linePipeline!: Pipeline;
  private pointPipeline!: Pipeline;
  private instancedTrianglePipeline!: Pipeline;
  private overlayMeshPipeline!: Pipeline;
  private idRasterPipeline!: Pipeline;

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

  public async getIdAtPixel(x: number, y: number): Promise<number> {

    // window is mirrored
    x = window.innerWidth - x;

    // TODO: factor buffer out
    const idBuffer = this.device.createBuffer({
      label: "id dst buffer",
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    const encoder = this.device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: this.idTexture, mipLevel: 0, origin: [x, y, 0] },
      { buffer: idBuffer, bytesPerRow: 256, rowsPerImage: 1 },
      [1, 1, 1]
    );
    this.device.queue.submit([encoder.finish()]);

    await this.device.queue.onSubmittedWorkDone();
    await idBuffer.mapAsync(GPUMapMode.READ);
    const data: Int32Array = new Int32Array(idBuffer.getMappedRange());
    return data[0];
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
    });
    this.overlayMeshShaderModule = this.device.createShaderModule({
      label: "overlay mesh shader module",
      code: overlayMeshShader,
    });
    this.idShaderModule = this.device.createShaderModule({
      label: "id shader module",
      code: idShader,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: "bind group layout",
      entries: [
        {
          binding: 0, // model points
          visibility: GPUShaderStage.VERTEX,
          buffer: {}
        }, {
          binding: 1, // model normals
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        }, {
          binding: 2, // color
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        }, {
          binding: 3, // flags
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {},
        }, {
          binding: 4, // id
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        }, {
          binding: 5, // subSelectionBuffer
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        }
      ]
    });

    // TODO: factor
    this.bindGroupLayoutInstanced = this.device.createBindGroupLayout({
      label: "bind group layout instanced",
      entries: [
        {
          binding: 0, // transform buffer
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        }
      ]
    });

    this.globalUniforms = new GlobalUniforms(this.device);

    this.updateScreenSize();

  }

  private createPipelines() {
    this.trianglePipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      [this.bindGroupLayout, this.globalUniforms.getLayout()],
      this.triangleShaderModule,
      PipelinePrimitive.Triangle,
      4);
    this.linePipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      [this.bindGroupLayout, this.globalUniforms.getLayout()],
      this.lineShaderModule,
      PipelinePrimitive.Line,
      4);
    this.pointPipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      [this.bindGroupLayout, this.globalUniforms.getLayout()],
      this.pointShaderModule,
      PipelinePrimitive.Point,
      4);
    this.instancedTrianglePipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      [this.bindGroupLayout, this.globalUniforms.getLayout(), this.bindGroupLayoutInstanced],
      this.instancedTriangleShaderModule,
      PipelinePrimitive.Triangle,
      4);
    this.overlayMeshPipeline = new Pipeline(
      this.device,
      this.canvasFormat,
      [this.bindGroupLayout, this.globalUniforms.getLayout()],
      this.overlayMeshShaderModule,
      PipelinePrimitive.Triangle,
      4);
    this.idRasterPipeline = new Pipeline(
      this.device,
      "r32sint",
      [this.bindGroupLayout, this.globalUniforms.getLayout()],
      this.idShaderModule,
      PipelinePrimitive.Triangle,
      1);
  }

  public updateScreenSize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.depthTextureSuperSample = this.device.createTexture({
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
    this.idTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      sampleCount: 1,
      format: "r32sint",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      sampleCount: 1,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
  }

  async render(scene: Scene) {

    // TODO: Factor this stuff out of main loop

    this.globalUniforms.tick();

    var drawCallCounter: number = 0;

    const encoder: GPUCommandEncoder = this.device.createCommandEncoder();

    // mainPass  ================================

    const mainPass: GPURenderPassEncoder = encoder.beginRenderPass({
      label: "main pass",
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
        view: this.depthTextureSuperSample.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    });

    this.globalUniforms.bind(mainPass);

    mainPass.setPipeline(this.trianglePipeline.get());
    for (let mesh of scene.getAllMeshes()) {
      if (!mesh.isOverlay()) {
        mesh.draw(mainPass);
        drawCallCounter++;
      }
    };

    mainPass.setPipeline(this.linePipeline.get());
    for (let lines of scene.getAllLines()) {
      lines.draw(mainPass);
      drawCallCounter++;
    };

    mainPass.setPipeline(this.pointPipeline.get());
    for (let points of scene.getAllPoints()) {
      points.draw(mainPass);
      drawCallCounter++;
    }

    mainPass.setPipeline(this.instancedTrianglePipeline.get());
    for (let mesh of scene.getAllMeshesInstanced()) {
      mesh.draw(mainPass);
      drawCallCounter++;
    }

    mainPass.end();

    // Overlay Pass ================================

    const overlayPass: GPURenderPassEncoder = encoder.beginRenderPass({
      label: "overlay pass",
      colorAttachments: [
        {
          view: this.renderTarget.createView(), // could maybe factor craete view out?
          resolveTarget: this.context.getCurrentTexture().createView(),
          loadOp: "load",
          clearValue: this.clearColor,
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTextureSuperSample.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    })
    overlayPass.setPipeline(this.overlayMeshPipeline.get());


    this.globalUniforms.bind(overlayPass);
    for (let mesh of scene.getAllMeshes()) {
      if (mesh.isOverlay()) {
        mesh.draw(overlayPass);
        drawCallCounter++;
      }
    }
    overlayPass.end();

    // ID Pass ================================
    // rasterize ids for mouse picking

    const idPass: GPURenderPassEncoder = encoder.beginRenderPass({
      label: "id pass",
      colorAttachments: [
        {
          view: this.idTexture.createView(),
          loadOp: "clear",
          clearValue: [0, 0, 0, 0], // TODO: delete after debug
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store" // prolly dont need to store this TODO:
      }
    });
    idPass.setPipeline(this.idRasterPipeline.get());

    this.globalUniforms.bind(idPass);

    for (let mesh of scene.getAllMeshes()) {
      if (mesh.isOverlay()) {
        mesh.draw(idPass);
        drawCallCounter++;
      }
    }

    idPass.end();

    const commandBuffer = encoder.finish();
    this.device.queue.submit([commandBuffer]);

    INSTANCE.getStats().setDrawCalls(drawCallCounter);

    await this.device.queue.onSubmittedWorkDone();

  }

}



