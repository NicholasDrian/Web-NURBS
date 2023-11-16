import { RenderMesh } from "./renderMesh"
import { RenderLines } from "./renderLines"
import { RenderPoints } from "./renderPoints";

export enum PipelinePrimitive {
  Triangle,
  Line,
  Point,
}

export class Pipeline {


  private gpuPipeline: GPURenderPipeline;

  constructor(device: GPUDevice, format: GPUTextureFormat, layouts: GPUBindGroupLayout[], shaderModule: GPUShaderModule, primitive: PipelinePrimitive, samples: number) {


    const pipelineLayout: GPUPipelineLayout = device.createPipelineLayout({
      label: getLabel(primitive) + " label",
      bindGroupLayouts: layouts,
    });

    this.gpuPipeline = device.createRenderPipeline({
      label: getLabel(primitive),
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
        buffers: [getVertexBufferLayout(primitive)]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: format
          }
        ]
      },
      multisample: {
        count: samples
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
    case PipelinePrimitive.Point: return "point-list";
    default:
      console.error("unimplemented primitive");
      return "triangle-list";
  }
}
function getVertexBufferLayout(primitive: PipelinePrimitive): GPUVertexBufferLayout {
  switch (primitive) {
    case PipelinePrimitive.Triangle: return RenderMesh.getVertexBufferLayout();
    case PipelinePrimitive.Line: return RenderLines.getVertexBufferLayout();
    case PipelinePrimitive.Point: return RenderPoints.getVertexBufferLayout();
    default:
      console.error("unimplemented primitive");
      return RenderMesh.getVertexBufferLayout();
  }
}
function getLabel(primitive: PipelinePrimitive): string {
  switch (primitive) {
    case PipelinePrimitive.Triangle: return "trinagle pipeline";
    case PipelinePrimitive.Line: return "line pipeline";
    case PipelinePrimitive.Point: return "point pipeline";
    default: throw new Error("not implemented");
  }
}
