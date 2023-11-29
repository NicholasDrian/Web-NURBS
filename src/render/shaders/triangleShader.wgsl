
// local uniforms;
@group(0) @binding(0) var<uniform> model : mat4x4<f32>;
@group(0) @binding(1) var<uniform> modelInverseTranspose : mat4x4<f32>;
@group(0) @binding(2) var<uniform> color : vec4<f32>;
@group(0) @binding(3) var<uniform> flags: i32;
@group(0) @binding(4) var<uniform> id: i32;
@group(0) @binding(5) var<storage, read> subSelection: array<u32>;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;
@group(1) @binding(2) var<uniform> selectionTransform: mat4x4<f32>;
@group(1) @binding(3) var<uniform> selectionTransformInverseTraspose: mat4x4<f32>;
@group(1) @binding(4) var<uniform> resolution: vec2<f32>;
// TODO: why is resolution.x 0? 

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 10.0;

fn applySelectionTransform(p: vec4<f32>) -> vec4<f32> {
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    return selectionTransform * p;
  } else {
    return p;
  }
}
fn applySelectionTransformNormal(p: vec4<f32>) -> vec4<f32> {
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    return selectionTransformInverseTraspose * p;
  } else {
    return p;
  }
}

struct VertexOutput {
  @builtin(position) fragCoord : vec4<f32>,
  @location(0) @interpolate(linear) normal : vec4<f32>,
  @location(1) @interpolate(linear) selectedness: f32,
  @location(2) @interpolate(linear) position: vec4<f32>,
}

@vertex
fn vertexMain(
    @builtin(vertex_index) index: u32,
    @location(0) objectSpacePosition : vec4<f32>,
    @location(1) objectSpaceNormal : vec4<f32>
    ) -> VertexOutput
{

  var worldSpacePosition = applySelectionTransform(model * objectSpacePosition.xzyw);
  var worldSpaceNormal = applySelectionTransformNormal(modelInverseTranspose * objectSpaceNormal.xzyw);

  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xzy);
    // TODO: dist should actually be dist in forward direction
    var scaledObjectSpacePosition: vec4<f32> = vec4<f32>(objectSpacePosition.xzy * dist, objectSpacePosition.w);
    worldSpacePosition = applySelectionTransform(model * scaledObjectSpacePosition.xzyw);
  } 

  var selectedness: f32 = 0;
  if ((flags & SELECTED_BIT) == SELECTED_BIT) { selectedness = 1; }
  if ((subSelection[index / 32] & (1u << (index % 32))) > 0u) { selectedness = 1; }

  var output: VertexOutput;
  output.normal = worldSpaceNormal;
  output.fragCoord = cameraViewProj * worldSpacePosition;
  output.position = worldSpacePosition;
  output.selectedness = selectedness;
  return output;
}




@fragment
fn fragmentMain(inputs: VertexOutput) -> @location(0) vec4f {

  var normalizedNormal: vec3<f32> = normalize(inputs.normal.xyz);
  var fragColor: vec4<f32> = color;

  fragColor = (fragColor * 0.5) + (inputs.normal * 0.5);

  var scaledFragCoords: vec2<f32> = inputs.fragCoord.xy / STRIPE_WIDTH;
  if (inputs.selectedness > 0) {
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
  fragColor.w = 0.5;
  return fragColor;

}



