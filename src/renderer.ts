
import triangleShader from "./triangleShader.wgsl";
import lineShader from "./lineShader.wgsl";
import { Scene } from "./scene"
import { Pipeline, PipelinePrimitive } from "./Pipeline"

const compatibilityCheck : HTMLElement = <HTMLElement> document.getElementById("compatibility-check");

export class Renderer {

	private device!: GPUDevice;
	private context!: GPUCanvasContext;
	private canvas!: HTMLCanvasElement;
	private canvasFormat!: GPUTextureFormat;
	private triangleShaderModule!: GPUShaderModule;
	private lineShaderModule!: GPUShaderModule;
	private viewProjBuffer!: GPUBuffer;
    private colorBuffer!: GPUBuffer;
    private colorBufferAlignment!: number;

	private depthTexture!: GPUTexture;
	private bindGroup!: GPUBindGroup;
	private bindGroupLayout!: GPUBindGroupLayout;

    private trianglePipeline!: Pipeline;
    private linePipeline!: Pipeline;

	constructor() {
	}

	public getDevice() {
		return this.device;
	}

	async init() {

		await this.createDevice();
		this.createResources();
		this.createPipelines();

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
		} catch(error) {
			console.log(error);
		}

		if (adapter! == null) {
			alert("Your browser / computer does not support WebGPU.");
			compatibilityCheck.innerText = "No valid gpu adapter. Check here for a list of supported browsers https://caniuse.com/webgpu";
			return;
		}
        if (adapter.limits.maxDynamicUniformBuffersPerPipelineLayout < 1) {
            alert("Your adapter does not support dynamic uniforms.");
            return;
        }
        this.colorBufferAlignment = adapter.limits.minUniformBufferOffsetAlignment;
        while (this.colorBufferAlignment < 16) this.colorBufferAlignment += adapter.limits.minUniformBufferOffsetAlignment;

		this.device = <GPUDevice> await adapter.requestDevice();
		this.canvas = <HTMLCanvasElement> document.getElementById("screen");
		this.context = <GPUCanvasContext> this.canvas.getContext("webgpu");


		this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
		this.context.configure({
			device: this.device,
			format: this.canvasFormat
		});

	}

	private createResources() {


		this.triangleShaderModule = this.device.createShaderModule({
			label: "shader module",
			code: triangleShader,
		});

		this.lineShaderModule = this.device.createShaderModule({
			label: "shader module",
			code: lineShader,
		});

		this.bindGroupLayout = this.device.createBindGroupLayout({
			label: "bind group layout",
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {}
				}, {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                       // hasDynamicOffset: true,
                       // minBindingSize: 16,
                    },
                }
			]
		});

		this.viewProjBuffer = this.device.createBuffer({
			label: "view proj buffer",
			size: 64,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.depthTexture = this.device.createTexture({
			size: [this.canvas.width, this.canvas.height],
			format: "depth24plus",
			usage: GPUTextureUsage.RENDER_ATTACHMENT
		});

	}

    private updateBindGroup() {

		this.bindGroup = this.device.createBindGroup({
			label: "bind group",
			layout: this.bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: this.viewProjBuffer },
				}, {
                    binding: 1,
                    resource: { buffer: this.colorBuffer },
                }
			]
		});
    }

	private createPipelines() {

        this.trianglePipeline = new Pipeline(this.device, this.canvasFormat, this.bindGroupLayout, this.triangleShaderModule, PipelinePrimitive.Triangle);
        this.linePipeline = new Pipeline(this.device, this.canvasFormat, this.bindGroupLayout, this.lineShaderModule, PipelinePrimitive.Line);

	}

	private updateScreenSize(): void {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.depthTexture = this.device.createTexture({
			size: [this.canvas.width, this.canvas.height],
			format: "depth24plus",
			usage: GPUTextureUsage.RENDER_ATTACHMENT
		});
	}

	async render(scene: Scene) {

        this.updateScreenSize();

        this.device.queue.writeBuffer(this.viewProjBuffer, 0, scene.getCamera().getViewProj());

        this.colorBuffer = this.device.createBuffer({
            label: "color buffer",
            size: this.colorBufferAlignment * (scene.getMeshes().length + scene.getLines().length),
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.updateBindGroup();

        const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
        const pass: GPURenderPassEncoder = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: [0.1, 0.1, 0.1, 1.0],
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

        pass.setBindGroup(0, this.bindGroup);

        var drawCall = 0;

        pass.setPipeline(this.trianglePipeline.get());
        for (let mesh of scene.getMeshes()) {
          //  this.device.queue.writeBuffer(this.colorBuffer, this.colorBufferAlignment * drawCall, mesh.getColor(), 0, 4);
          //  pass.setBindGroup(0, this.bindGroup, new Uint32Array([this.colorBufferAlignment * drawCall]), drawCall, 1);
            pass.setVertexBuffer(0, mesh.getVertexBuffer());
            pass.setIndexBuffer(mesh.getIndexBuffer(), "uint32");
            pass.drawIndexed(mesh.getIndexCount());
            drawCall++;
        };

        pass.setPipeline(this.linePipeline.get());
        for (let lines of scene.getLines()) {
          //  this.device.queue.writeBuffer(this.colorBuffer, this.colorBufferAlignment * drawCall, lines.getColor(), 0, 4);
          //  pass.setBindGroup(0, this.bindGroup, new Uint32Array([this.colorBufferAlignment * drawCall]), drawCall, 1);
            pass.setVertexBuffer(0, lines.getVertexBuffer());
            pass.setIndexBuffer(lines.getIndexBuffer(), "uint32");
            pass.drawIndexed(lines.getIndexCount());
            drawCall++;
        };

        pass.end();
        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);

        await this.device.queue.onSubmittedWorkDone();

	}

}



