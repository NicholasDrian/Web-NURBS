import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { RenderLines } from "../render/renderLines";
import { uuid } from "../scene/scene";


export class Line {

    private renderLines!: uuid;

    constructor(
        private a: Vec3,
        private b: Vec3,
        private color: [number, number, number, number]
    ) {
        this.renderLines = 0;
        this.updateRenderLines();
    }

    private updateRenderLines(): void {

        // remove previous lines
        if (this.renderLines) INSTANCE.getScene().removeLines(this.renderLines);

        // add mew lines
        this.renderLines = INSTANCE.getScene().addLines(new RenderLines(
            new Float32Array([...this.a, 1.0, ...this.b, 1.0]),
            new Int32Array([0, 1]),
            this.color
        ));
    }

    public delete(): void {
        INSTANCE.getScene().removeLines(this.renderLines);
    }

    public getStart(): Vec3 {
        return this.a;
    }

    public getEnd(): Vec3 {
        return this.b;
    }

    public updateEnd(point: Vec3): void {
        this.b = point;
        this.updateRenderLines();
    }

    public getLength(): number {
        return vec3.distance(this.a, this.b);
    }

    public flip(): void {
        [this.a, this.b] = [this.b, this.a];
    }

}
