
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

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 10.0;

@vertex
fn vertexMain(
    @location(0) objectSpacePosition : vec4<f32>,
    ) -> VertexOutput
{
  var worldSpacePosition = model * objectSpacePosition.xzyw;

  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xzy);
    // TODO: Magic number should prolly be factored out...
    worldSpacePosition = model * vec4<f32>(objectSpacePosition.xzy * dist, objectSpacePosition.w);
  } 

  var output: VertexOutput;
  output.position = cameraViewProj * model * worldSpacePosition;
  return output;
}

struct FragOutputs {
  @builtin(frag_depth) depth: f32,
  @location(0) color: vec4f,
}

struct FragInputs {
  @builtin(position) fragCoords: vec4<f32>,
}

@fragment
fn fragmentMain(inputs: FragInputs) -> FragOutputs {

  var fragColor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  var scaledFragCoords: vec2<f32> = inputs.fragCoords.xy / STRIPE_WIDTH;
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    
      var evenX: bool = modf(scaledFragCoords.x).fract < 0.5;
      var evenY: bool = modf(scaledFragCoords.y).fract < 0.5;
      if ((evenX && !evenY) || (evenY && !evenX)) {
        fragColor = vec4<f32>(1.0, 1.0, 0.0, 1.0);
      }
   
  }
  if ((flags & HOVER_BIT) == HOVER_BIT) {

      var evenX: bool = modf(scaledFragCoords.x).fract < 0.5;
      var evenY: bool = modf(scaledFragCoords.y).fract < 0.5;
      if ((evenX && !evenY) || (evenY && !evenX)) {
        fragColor = vec4<f32>(0.0, 0.0, 1.0, 1.0);
      }

  }
  var output: FragOutputs;
  output.color = fragColor;
  output.depth = inputs.fragCoords.z * 0.9999;
  return output;
}


