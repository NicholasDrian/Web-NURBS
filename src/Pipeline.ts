import { Mesh } from "./mesh"

export enum PipelinePrimitive {
    Triangle,
    Line,
}

export class Pipeline {

    private gpuPipeline: GPURenderPipeline;

    constructor(device: GPUDevice, format: GPUTextureFormat, layout: GPUBindGroupLayout, shaderModule: GPUShaderModule, primitive: PipelinePrimitive) {

        const pipelineLayout: GPUPipelineLayout = device.createPipelineLayout({
			label: "pipeline layout",
			bindGroupLayouts: [layout],
		});

		this.gpuPipeline = device.createRenderPipeline({
			label: "pipeline",
			primitive: {
				topology: getTopology(primitive),
				cullMode: "none"
			},
			layout: pipelineLayout,
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: "less",
				format: "depth24plus"
			},
			vertex: {
				module: shaderModule,
				entryPoint: "vertexMain",
				buffers: [Mesh.getVertexBufferLayout()] // TODO: Update based on primitive type
			},
			fragment: {
				module: shaderModule,
				entryPoint: "fragmentMain",
				targets: [
					{
						format: format
					}
				]
			}
		});
    }

    public get(): GPURenderPipeline {
        return this.gpuPipeline;
    }

}

function getTopology(primitive: PipelinePrimitive): GPUPrimitiveTopology {
    switch (primitive) {
        case PipelinePrimitive.Triangle: return "triangle-list";
        case PipelinePrimitive.Line: return "line-list";
        default:
            console.error("unimplemented primitive");
            return "triangle-list";
    }
}
