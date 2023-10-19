import { vec3, Vec3 } from "wgpu-matrix"


export class Plane {

    constructor(
        private origin: Vec3,
        private normal: Vec3
    ) {
        this.normal = vec3.normalize(this.normal);
    }

    public getOrigin(): Vec3 {
        return this.origin;
    }

    public getNormal(): Vec3 {
        return this.normal;
    }

}
