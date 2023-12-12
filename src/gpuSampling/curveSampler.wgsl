
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> weightedControls: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> knots: array<f32>;
@group(0) @binding(3) var<storage, read_write> samples: array<vec4<f32>>;

struct Params {
  controlCount: u32,
  degree: u32,
};

@compute @workgroup_size(1,1,1) 
fn main(@builtin(global_invocation_id) id: vec3<u32>,
    @builtin(num_workgroups) groupCount: vec3<u32>) {
}

