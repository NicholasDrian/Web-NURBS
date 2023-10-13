

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


	constructor(
		private device: GPUDevice,
		private vertices: Float32Array,
		private indices: Int32Array) {

		this.vertexBuffer = this.device.createBuffer({
			label: "vertex buffer",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
		this.indexBuffer = this.device.createBuffer({
			label: "index buffer",
			size: this.indices.byteLength,
			usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(this.indexBuffer, 0, this.indices!);
    }

    public getVertexBuffer(): GPUBuffer {
        return this.vertexBuffer;
    }

    public getIndexBuffer(): GPUBuffer {
        return this.indexBuffer;
    }

    public getIndexCount(): number {
        return this.indices.length;
    }

    public static getVertexBufferLayout(): GPUVertexBufferLayout {
        return Lines.vertexBufferLayout;
    }

}
