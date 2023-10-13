
import shader from "./shader.wgsl";
import { Mesh } from "./mesh"
import { Scene } from "./scene"
import { Pipeline, PipelinePrimitive } from "./Pipeline"

const compatibilityCheck : HTMLElement = <HTMLElement> document.getElementById("compatibility-check");

export class Renderer {

	private device!: GPUDevice;
	private context!: GPUCanvasContext;
	private canvas!: HTMLCanvasElement;
	private canvasFormat!: GPUTextureFormat;
	private shaderModule!: GPUShaderModule;
	private viewProjBuffer!: GPUBuffer;
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


		this.shaderModule = this.device.createShaderModule({
			label: "shader module",
			code: shader,
		});

		this.bindGroupLayout = this.device.createBindGroupLayout({
			label: "bind group layout",
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX,
					buffer: {}
				}
			]
		});

		this.viewProjBuffer = this.device.createBuffer({
			label: "view proj buffer",
			size: 64,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		this.bindGroup = this.device.createBindGroup({
			label: "bind group",
			layout: this.bindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: { buffer: this.viewProjBuffer },
				}
			]
		});
		this.depthTexture = this.device.createTexture({
			size: [this.canvas.width, this.canvas.height],
			format: "depth24plus",
			usage: GPUTextureUsage.RENDER_ATTACHMENT
		});

	}

	private createPipelines() {

        this.trianglePipeline = new Pipeline(this.device, this.canvasFormat, this.bindGroupLayout, this.shaderModule, PipelinePrimitive.Triangle);
        this.linePipeline = new Pipeline(this.device, this.canvasFormat, this.bindGroupLayout, this.shaderModule, PipelinePrimitive.Line);

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

		const encoder: GPUCommandEncoder = this.device.createCommandEncoder();
		const pass: GPURenderPassEncoder = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: this.context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: [0.7,0.8,1,1],
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

		pass.setPipeline(this.trianglePipeline.get());
		for (let mesh of scene.getMeshes()) {
			pass.setVertexBuffer(0, mesh.getVertexBuffer());
			pass.setIndexBuffer(mesh.getIndexBuffer(), "uint32");
			pass.drawIndexed(mesh.getIndexCount());
		};

		pass.setPipeline(this.linePipeline.get());
		for (let line of scene.getLines()) {
			pass.setVertexBuffer(0, line.getVertexBuffer());
			pass.setIndexBuffer(line.getIndexBuffer(), "uint32");
			pass.drawIndexed(line.getIndexCount());
		};

		pass.end();
		const commandBuffer = encoder.finish();
		this.device.queue.submit([commandBuffer]);

		await this.device.queue.onSubmittedWorkDone();

	}

}













