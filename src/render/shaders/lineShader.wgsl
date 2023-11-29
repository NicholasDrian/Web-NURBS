
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) @interpolate(linear) selectedness: f32,
}

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

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 10.0;

const SELECTED_COLOR: vec4<f32> = vec4<f32>(1,1,0,1);

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
    @builtin(vertex_index) index: u32,
    ) -> VertexOutput
{

  var worldSpacePosition = applySelectionTransform(toWorldSpace(objectSpacePosition));
  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xyz);
    // TODO: dist should actually be dist in forward direction
    var scaledObjectSpacePosition: vec4<f32> = vec4<f32>(objectSpacePosition.xzy * dist, objectSpacePosition.w);
    worldSpacePosition = applySelectionTransform(toWorldSpace(scaledObjectSpacePosition));
  } 

  var selectedness: f32 = 0;
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {selectedness = 1;}
  if ((subSelection[index / 32] & (1u << (index % 32))) > 0) {selectedness = 1;}

  var output: VertexOutput;
  output.position = cameraViewProj * worldSpacePosition;
  output.selectedness = selectedness;
  return output;
}

struct FragOutputs {
  @builtin(frag_depth) depth: f32,
  @location(0) color: vec4f,
}


@fragment
fn fragmentMain(inputs: VertexOutput) -> FragOutputs {

  // set up frag color
  var fragColor: vec4<f32> = color;

  var depth: f32 = inputs.position.z * 0.9999999;

  var scaledFragCoords: vec2<f32> = inputs.position.xy / STRIPE_WIDTH;
  if (inputs.selectedness > 0) {
   fragColor = (1 - inputs.selectedness) * fragColor + (inputs.selectedness) * SELECTED_COLOR;
    depth *= 0.9999999;
  }
  if ((flags & HOVER_BIT) == HOVER_BIT) {
   fragColor = vec4<f32>(0.0, 0.0, 1.0, 1.0);
    depth *= 0.9999999;
  }

  var output: FragOutputs;
  output.color = fragColor;
  output.color = fragColor;
  output.depth = depth;
  return output;
}



