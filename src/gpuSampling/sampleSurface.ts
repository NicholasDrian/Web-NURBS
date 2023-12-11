
import { Vec4 } from "wgpu-matrix";



export const sampleSurface = async function(
  weightedControls: Vec4[][],
  knotsU: number[],
  knotsV: number[],
  degreeU: number,
  degreeV: number
): Promise<GPUBuffer> {

  // GPU Accelerated Sampling :)
  throw new Error("Todo");

}
