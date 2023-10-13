
struct VertexOutput {
	@builtin(position) position : vec4<f32>,
	@location(0) @interpolate(linear) normal : vec4<f32>
}

@group(0) @binding(0) var<uniform> viewProj : mat4x4<f32>;

@vertex
fn vertexMain(
	@location(0) position : vec4<f32>,
	@location(1) normal : vec4<f32>
	) -> VertexOutput 
{
	var output: VertexOutput;
	output.normal = normal;
	output.position = viewProj * position;
	return output;
}

const green: vec3<f32> = vec3<f32>(62.0/255.0, 166.0/255.0, 53.0/255.0);
const brown: vec3<f32> = vec3<f32>(128.0/255.0, 86.0/255.0, 41.0/255.0);
const grey: vec3<f32> = vec3<f32>(100.0/255.0, 100.0/255.0, 100.0/255.0);
const sunDirection: vec3<f32> = normalize(vec3<f32>(1.0, 1.0, 1.0));

fn lerp(a: vec3<f32>, b: vec3<f32>, alpha: f32) -> vec3<f32> {
	return alpha * b + (1.0 - alpha) * a;	
}

@fragment
fn fragmentMain(@location(0) @interpolate(linear) normal : vec4f) -> @location(0) vec4f {

	var normalizedNormal: vec3<f32> = normalize(normal.xyz);
	var color: vec3<f32>;
	if (normalizedNormal.y > 0.0) {
		color = lerp(brown, green, normalizedNormal.y);	
	} else {
		color = lerp(brown, grey, -normalizedNormal.y);
	}
	var diffuse: f32 = clamp(dot(normalizedNormal, sunDirection), 0.0, 1.0);
	var specular: f32 = diffuse * diffuse;
	return vec4<f32>(
		color * (0.5 + diffuse * 0.3 + specular * 0.5)
	, 1.0);
}



