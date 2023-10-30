
struct VertexOutput {
	@builtin(position) position: vec4<f32>,
	@location(0) @interpolate(linear) normal: vec4<f32>
}

// local uniforms:
@group(0) @binding(0) var<uniform> modelViewProj: mat4x4<f32>;
@group(0) @binding(1) var<uniform> color: vec4<f32>;
@group(0) @binding(2) var<uniform> flags: i32;
@group(0) @binding(3) var<storage, read> transforms: array<mat4x4<f32>>;

// global uniforms:
@group(1) @binding(0) var<uniform> cameraPos: vec3<f32>;


@vertex
fn vertexMain(
	@location(0) position: vec4<f32>,
	@location(1) normal: vec4<f32>,
  @builtin(instance_index) instanceID: u32,
	) -> VertexOutput
{
	var output: VertexOutput;
	output.normal = normal.xzyw;
	output.position = modelViewProj * transforms[instanceID] * position.xzyw;
	return output;
}


@fragment
fn fragmentMain(@location(0) @interpolate(linear) normal: vec4f) -> @location(0) vec4f {

	var normalizedNormal: vec3<f32> = normalize(normal.xyz);
    return vec4<f32>(normalizedNormal/2.0 + vec3<f32>(0.5, 0.5, 0.5), 1.0);

}



