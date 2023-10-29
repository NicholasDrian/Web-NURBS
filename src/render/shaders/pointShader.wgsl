
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

@group(0) @binding(0) var<uniform> viewProj : mat4x4<f32>;
@group(0) @binding(1) var<uniform> color : vec4<f32>;

@vertex
fn vertexMain(
    @location(0) position : vec4<f32>,
    ) -> VertexOutput
{
  var output: VertexOutput;
  output.position = viewProj * position.xzyw;
  return output;
}

struct FragOutputs {
  @builtin(frag_depth) depth: f32,
  @location(0) color: vec4f,
}

struct FragInputs {
  @builtin(position) position: vec4<f32>,
}

@fragment
fn fragmentMain(input: FragInputs) -> FragOutputs {
  var output: FragOutputs;
  output.color = vec4<f32>(1,0,0,1);
  output.depth = input.position.z * 0.9999;
  return output;
}


