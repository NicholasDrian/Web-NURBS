import { Mat4, mat4 } from "wgpu-matrix"
import { INSTANCE } from "../cad"

export class Lines {

	private static readonly vertexBufferLayout : GPUVertexBufferLayout = {
			arrayStride: 16,
			attributes: [
				{ // location
					format: "float32x4",
					offset: 0,
					shaderLocation : 0,
				}
			]
	};

	private vertexBuffer : GPUBuffer;
	private indexBuffer : GPUBuffer;
    private bindGroup!: GPUBindGroup;
    private mvp: Float32Array;
    private mvpBuffer: GPUBuffer;
    private colorBuffer: GPUBuffer;


	constructor(
		private device: GPUDevice,
		private vertices: Float32Array,
		private indices: Int32Array,
        private color: Float32Array,
        private model: Mat4 = mat4.identity()
    ) {

        // vertex
		this.vertexBuffer = this.device.createBuffer({
			label: "vertex buffer",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);

        //index
		this.indexBuffer = this.device.createBuffer({
			label: "index buffer",
			size: this.indices.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices!);

        //mvp
        this.mvpBuffer = this.device.createBuffer({
            label: "mvp",
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.mvp = new Float32Array(16);

        //color
        this.colorBuffer = device.createBuffer({
            label: "color buffer",
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.colorBuffer, 0, color);

    }

    public draw(pass: GPURenderPassEncoder): void {
            pass.setBindGroup(0, this.bindGroup);
            pass.setVertexBuffer(0,this.vertexBuffer);
            pass.setIndexBuffer(this.indexBuffer, "uint32");
            pass.drawIndexed(this.indices.length);
    }

    public update(): void {
        this.updateMVP();
        this.updateBindGroup();
    }

    private updateMVP(): void {
        mat4.mul(this.model, INSTANCE.getScene().getCamera().getViewProj(), this.mvp);
        this.device.queue.writeBuffer(this.mvpBuffer, 0, this.mvp);
    }

    private updateBindGroup(): void {

		this.bindGroup = this.device.createBindGroup({
			label: "bind group",
			layout: INSTANCE.getRenderer().getBindGroupLayout(),
			entries: [
				{
					binding: 0,
					resource: { buffer: this.mvpBuffer },
				}, {
                    binding: 1,
                    resource: { buffer: this.colorBuffer },
                }
			]
		});
    }

    public static getVertexBufferLayout(): GPUVertexBufferLayout {
        return Lines.vertexBufferLayout;
    }

}
