struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

// local uniforms;
@group(0) @binding(0) var<uniform> model : mat4x4<f32>;
@group(0) @binding(1) var<uniform> color : vec4<f32>;
@group(0) @binding(2) var<uniform> flags: i32;
@group(0) @binding(3) var<uniform> id: i32;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;
@group(1) @binding(2) var<uniform> selectionTransform: mat4x4<f32>;
@group(1) @binding(3) var<uniform> resolution: vec2<f32>;
// TODO: why is resolution.x 0? 

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 10.0;

@vertex
fn vertexMain(
    @location(0) position : vec4<f32>,
    @location(1) normal : vec4<f32>
    ) -> VertexOutput
{
  var worldSpacePosition = model * position.xzyw;

  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xzy);
    // TODO: Magic number should prolly be factored out...
    worldSpacePosition = model * vec4<f32>(position.xzy * dist, position.w);
  } 

  var output: VertexOutput;
  output.position = cameraViewProj * worldSpacePosition;
  return output;
}


struct FragInputs {
  @builtin(position) fragCoords: vec4<f32>,
}

@fragment
fn fragmentMain(inputs: FragInputs) -> @location(0) i32 {

  return id;

}




