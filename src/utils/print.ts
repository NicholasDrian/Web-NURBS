import { mat4, mat3, Mat4, Vec3 } from "wgpu-matrix";

export const printMat4 = function(m : Mat4): void {
	var str: string = "";
	for (var i: number = 0; i < 4; i++) {
		for (var j: number = 0; j < 4; j++) {
			str += m[4 * i + j].toFixed(2) + ",  ";
		}
		str += "\n";
	}
	console.log(str);	
}

export const printVec3 = function(v : Vec3): void {
	var str: string = "";
	for (var i: number = 0; i < 3; i++) {
		str += v[i].toFixed(2) + ",  ";
	}
	console.log(str);	
}
