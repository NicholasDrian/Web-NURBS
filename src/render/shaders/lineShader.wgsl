
struct VertexOutput {
	@builtin(position) position : vec4<f32>,
}

@group(0) @binding(0) var<uniform> viewProj : mat4x4<f32>;
@group(0) @binding(1) var<uniform> color : vec4<f32>;

@vertex
fn vertexMain(
	@location(0) position : vec4<f32>,
	) -> VertexOutput
{
	var output: VertexOutput;
	output.position = viewProj * position.xzyw;
	return output;
}


@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4<f32>(0.8, 0.6, 0.6, 1.0);
}



