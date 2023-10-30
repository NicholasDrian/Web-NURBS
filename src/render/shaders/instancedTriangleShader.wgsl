
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
    @location(0) @interpolate(linear) normal: vec4<f32>
}

// local uniforms:
@group(0) @binding(0) var<uniform> model: mat4x4<f32>;
@group(0) @binding(1) var<uniform> color: vec4<f32>;
@group(0) @binding(2) var<uniform> flags: u32;
@group(0) @binding(3) var<storage, read> transforms: array<mat4x4<f32>>;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;

const CONSTANT_SCREEN_SIZE_BIT: u32 = 1 << 0;

@vertex
fn vertexMain(
    @location(0) objectSpacePosition: vec4<f32>,
    @location(1) normal: vec4<f32>,
    @builtin(instance_index) instanceID: u32) -> VertexOutput 
{

  var toWorldSpace = model * transforms[instanceID];
  var worldSpacePosition = toWorldSpace * objectSpacePosition.xzyw;

  if ((flags & CONSTANT_SCREEN_SIZE_BIT) != 0) {
    // scale object by distance (in model space)
    var dist: f32 = distance(worldSpacePosition.xyz, cameraPos.xzy);
    worldSpacePosition = toWorldSpace * vec4<f32>(objectSpacePosition.xzy * dist, objectSpacePosition.w);
  } 

  var output: VertexOutput;
  output.normal = normal.xzyw;
  output.position = cameraViewProj * worldSpacePosition;
  return output;
}


@fragment
fn fragmentMain(@location(0) @interpolate(linear) normal: vec4f) -> @location(0) vec4f {

  var normalizedNormal: vec3<f32> = normalize(normal.xyz);
  return vec4<f32>(normalizedNormal/2.0 + vec3<f32>(0.5, 0.5, 0.5), 1.0);

}



