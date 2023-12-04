// local uniforms:
@group(0) @binding(0) var<uniform> model: mat4x4<f32>;
@group(0) @binding(1) var<uniform> modelInverseTranspose : mat4x4<f32>;
@group(0) @binding(2) var<uniform> material: Material;
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

struct Material {
  color: vec4<f32>,
  emissive: vec4<f32>,
  ambientIntensity: f32,
  pseudoDiffuseIntensity: f32,
  specularity: f32,
  specularIntensity: f32,
}

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
fn applySelectionTransformNormal(p: vec4<f32>) -> vec4<f32> {
  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    return selectionTransformInverseTraspose * p;
  } else {
    return p;
  }
}

@vertex
fn vertexMain(
    @location(0) objectSpacePosition: vec4<f32>,
    @location(1) objectSpaceNormal: vec4<f32>,
    @builtin(instance_index) instanceID: u32) -> FragInput 
{

  var worldSpacePosition = applySelectionTransform(toWorldSpace(objectSpacePosition, instanceID));
  var worldSpaceNormal = applySelectionTransformNormal(modelInverseTranspose * objectSpaceNormal.xzyw);

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
  output.normal = worldSpaceNormal;
  output.fragCoord = cameraViewProj * worldSpacePosition;
  output.position = worldSpacePosition;
  output.selected = selected;
  return output;
}


fn calculateLighting(position: vec4<f32>, normal: vec3<f32>, material: Material) -> vec4<f32> {
  var toCamera: vec3<f32> = normalize(cameraPos.xyz - position.xyz);

  var flippedNormal: vec3<f32> = normal;
  if (dot(toCamera, normal) < 0) {
    flippedNormal *= -1;
  } 

  let normalizedLightIntensity: f32 = dot(flippedNormal, vec3<f32>(0,1,0)) * 0.5 + 0.5;
  let reflectedLight: vec3<f32> = reflect(vec3<f32>(0,1,0), normal);
  let pseudoDiffuse: vec4<f32> = material.color * normalizedLightIntensity * material.pseudoDiffuseIntensity;
  let ambient: vec4<f32> = material.color * material.ambientIntensity;
  let specular: vec4<f32> = material.color * pow(max(dot(reflectedLight, toCamera) * -0.5 + 0.5, 0), material.specularity) * material.specularIntensity;

  return pseudoDiffuse + ambient + specular + material.emissive;
}

struct FragInput {
  @builtin(position) fragCoord: vec4<f32>,
  @location(0) @interpolate(linear) normal: vec4<f32>,
  @location(1) @interpolate(linear) position: vec4<f32>,
  @location(2) @interpolate(flat) selected: u32,
}

struct FragOutputs {
  @builtin(frag_depth) depth: f32,
  @location(0) color: vec4f,
}


@fragment
fn fragmentMain(inputs: FragInput) -> FragOutputs {

  var normalizedNormal: vec3<f32> = normalize(inputs.normal.xyz);
  var fragColor: vec4<f32> = calculateLighting(inputs.position, normalizedNormal, material);

  var scaledFragCoords: vec2<f32> = inputs.fragCoord.xy / STRIPE_WIDTH;

  var depth: f32 = inputs.fragCoord.z;

  if (inputs.selected > 0u) {
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

  var res: FragOutputs;
  res.depth = depth;
  res.color = fragColor;
  return res;

}



