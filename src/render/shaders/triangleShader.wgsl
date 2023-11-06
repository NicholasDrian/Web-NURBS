struct VertexOutput {
  @builtin(position) position : vec4<f32>,
    @location(0) @interpolate(linear) normal : vec4<f32>
}

@group(0) @binding(0) var<uniform> model : mat4x4<f32>;
@group(0) @binding(1) var<uniform> color : vec4<f32>;
@group(0) @binding(2) var<uniform> flags: i32;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;
@group(1) @binding(1) var<uniform> cameraViewProj: mat4x4<f32>;
@group(1) @binding(2) var<uniform> selectionTransform: mat4x4<f32>;
@group(1) @binding(3) var<uniform> resolution: vec2<f32>;

const CONSTANT_SCREEN_SIZE_BIT: i32 = 1 << 0;
const HOVER_BIT: i32 = 1 << 1;
const SELECTED_BIT: i32 = 1 << 2;

const STRIPE_WIDTH: f32 = 2.0;

@vertex
fn vertexMain(
    @location(0) position : vec4<f32>,
    @location(1) normal : vec4<f32>
    ) -> VertexOutput
{
  var output: VertexOutput;
  output.normal = normal.xzyw;
  output.position = cameraViewProj * model * position.xzyw;
  return output;
}


struct FragInputs {
  @location(0) @interpolate(linear) normal : vec4f,
  @builtin(position) fragCoords: vec4<f32>,
}

@fragment
fn fragmentMain(inputs: FragInputs) -> @location(0) vec4f {

  var normalizedNormal: vec3<f32> = normalize(inputs.normal.xyz);
  var res: vec4<f32> = vec4<f32>(normalizedNormal/2.0 + vec3<f32>(0.5, 0.5, 0.5), 1.0);

  var pixelCoord: vec2<f32> = (inputs.fragCoords.xy * 0.5 + vec2<f32>(0.5, 0.5)) * resolution;
  var scaledPixelCoord: vec2<f32> = pixelCoord / STRIPE_WIDTH;
  // why is resolution.x 0? 


  if ((flags & SELECTED_BIT) == SELECTED_BIT) {
    
    if (modf(scaledPixelCoord.y).fract < 0.5) {
      res = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }
   
  }
  if ((flags & HOVER_BIT) == HOVER_BIT) {

    if (modf(scaledPixelCoord.y).fract < 0.5) {
      res = vec4<f32>(1.0, 1.0, 0.0, 1.0);
    }

  }
  return res;

}



