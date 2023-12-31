
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

// local uniforms;
@group(0) @binding(0) var<uniform> model : mat4x4<f32>;
@group(0) @binding(1) var<uniform> modelInverseTranspose : mat4x4<f32>;
@group(0) @binding(2) var<uniform> color : vec4<f32>;
@group(0) @binding(3) var<uniform> flags: i32;
@group(0) @binding(4) var<uniform> id: i32;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;
@group(1) @binding(2) var<uniform> selectionTransform: mat4x4<f32>;
@group(1) @binding(3) var<uniform> selectionTransformInverseTraspose: mat4x4<f32>;
@group(1) @binding(4) var<uniform> resolution: vec2<f32>;

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 10.0;

fn toWorldSpace(p: vec4<f32>) -> vec4<f32> {
  return model * p.xzyw;
}

fn applySelectionTransform(p: vec4<f32>) -> vec4<f32> {
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    return selectionTransform * p;
  } else {
    return p;
  }
}

@vertex
fn vertexMain(
    @location(0) objectSpacePosition : vec4<f32>,
    ) -> VertexOutput
{
  var worldSpacePosition = applySelectionTransform(toWorldSpace(objectSpacePosition));

  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xyz);
    // TODO: dist should actually be dist in forward direction
    var scaledObjectSpacePosition: vec4<f32> = vec4<f32>(objectSpacePosition.xzy * dist, objectSpacePosition.w);
    worldSpacePosition = applySelectionTransform(toWorldSpace(scaledObjectSpacePosition));
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
  var depth: f32 = inputs.fragCoords.z * 0.9999999;
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    
      var evenX: bool = modf(scaledFragCoords.x).fract < 0.5;
      var evenY: bool = modf(scaledFragCoords.y).fract < 0.5;
      if ((evenX && !evenY) || (evenY && !evenX)) {
        fragColor = vec4<f32>(1.0, 1.0, 0.0, 1.0);
      }
    depth *= 0.9999999;
   
  }
  if ((flags & HOVER_BIT) == HOVER_BIT) {

      var evenX: bool = modf(scaledFragCoords.x).fract < 0.5;
      var evenY: bool = modf(scaledFragCoords.y).fract < 0.5;
      if ((evenX && !evenY) || (evenY && !evenX)) {
        fragColor = vec4<f32>(0.0, 0.0, 1.0, 1.0);
      }
    depth *= 0.9999999;

  }
  var output: FragOutputs;
  output.color = fragColor;
  output.depth = depth;
  return output;
}


