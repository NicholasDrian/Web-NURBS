import { vec3, Vec3 } from "wgpu-matrix";
import { Plane } from "./plane";


export class Ray {

    constructor(
        private origin: Vec3,
        private direction: Vec3
    ) {
        this.direction = vec3.normalize(this.direction);
    }

    public at(time: number): Vec3 {
        return vec3.add(this.origin, vec3.scale(this.direction, time));
    }

    public intersect(plane: Plane): Vec3 | null {
        const numerator: number = vec3.dot(vec3.sub(plane.getOrigin(), this.origin), plane.getNormal());
        const denominator: number = vec3.dot(this.direction, plane.getNormal());
        if (denominator === 0) { // parallel case
            if (numerator == 0) return this.origin;
            else return null;
        }
        return this.at(numerator / denominator);
    }

}