
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

@group(0) @binding(0) var<uniform> model : mat4x4<f32>;
@group(0) @binding(1) var<uniform> color : vec4<f32>;
@group(0) @binding(2) var<uniform> flags: i32;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;
@group(1) @binding(2) var<uniform> selectionTransform: mat4x4<f32>;
@group(1) @binding(3) var<uniform> resolution: vec2<f32>;

@vertex
fn vertexMain(
    @location(0) position : vec4<f32>,
    ) -> VertexOutput
{
  var output: VertexOutput;
  output.position = cameraViewProj * model * position.xzyw;
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
  output.color = color;
  output.depth = input.position.z * 0.9999999;
  return output;
}



