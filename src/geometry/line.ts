import { vec3, Vec3 } from "wgpu-matrix";


export class Line {

    constructor(
        private a: Vec3,
        private b: Vec3
    ) {

    }

    public getStart(): Vec3 {
        return this.a;
    }

    public getEnd(): Vec3 {
        return this.b;
    }

    public getLength(): number {
        return vec3.distance(this.a, this.b);
    }

    public flip(): void {
        [this.a, this.b] = [this.b, this.a];
    }

}
