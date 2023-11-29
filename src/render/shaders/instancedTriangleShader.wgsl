// local uniforms:
@group(0) @binding(0) var<uniform> model: mat4x4<f32>;
@group(0) @binding(1) var<uniform> modelInverseTranspose : mat4x4<f32>;
@group(0) @binding(2) var<uniform> color: vec4<f32>;
@group(0) @binding(3) var<uniform> flags: i32;
@group(0) @binding(4) var<uniform> id: i32;
@group(0) @binding(5) var<storage, read> subSelection: array<u32>;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;
@group(1) @binding(2) var<uniform> selectionTransform: mat4x4<f32>;
@group(1) @binding(3) var<uniform> selectionTransformInverseTraspose: mat4x4<f32>;
@group(1) @binding(4) var<uniform> resolution: vec2<f32>;

// instance uniforms:
@group(2) @binding(0) var<storage, read> transforms: array<mat4x4<f32>>;

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 10.0;

fn toWorldSpace(p: vec4<f32>, instanceID: u32) -> vec4<f32> {
  return model * transforms[instanceID] * p.xzyw;
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
    @location(0) objectSpacePosition: vec4<f32>,
    @location(1) normal: vec4<f32>,
    @builtin(instance_index) instanceID: u32) -> FragInput 
{

  var worldSpacePosition = applySelectionTransform(toWorldSpace(objectSpacePosition, instanceID));

  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xyz);
    // TODO: dist should actually be dist in forward direction
    var scaledObjectSpacePosition: vec4<f32> = vec4<f32>(objectSpacePosition.xzy * dist, objectSpacePosition.w);
    worldSpacePosition = applySelectionTransform(toWorldSpace(scaledObjectSpacePosition, instanceID));
  } 

  var selected: u32 = 0u;
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    selected = 1u;
  }
  if (selected == 0u) {
    selected = (subSelection[instanceID / 32] & (1u << (instanceID % 32u)));
  }


  var output: FragInput;
  output.normal = normal.xzyw;
  output.position = cameraViewProj * worldSpacePosition;
  output.selected = selected;
  return output;
}

struct FragInput {
  @location(0) @interpolate(linear) normal: vec4<f32>,
  @location(1) @interpolate(flat) selected: u32,
  @builtin(position) position: vec4<f32>,
}


@fragment
fn fragmentMain(inputs: FragInput) -> @location(0) vec4f {

  var normalizedNormal: vec3<f32> = normalize(inputs.normal.xyz);
  var fragColor: vec4<f32> = vec4<f32>(normalizedNormal/2.0 + vec3<f32>(0.5, 0.5, 0.5), 1.0);
  var scaledFragCoords: vec2<f32> = inputs.position.xy / STRIPE_WIDTH;

  if (inputs.selected > 0u) {
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

  return fragColor;
}



