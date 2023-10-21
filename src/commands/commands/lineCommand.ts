import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Line } from "../../geometry/line";
import { Ray } from "../../geometry/ray";
import { Command } from "../command";


export class LineCommand extends Command {

    private finished: boolean;
    private line: Line | null;

    constructor() {
        super();
        this.finished = false;
        this.line = null;
    }

    public handleInput(input: string): void {
        if (input == "0") {
            if (this.line) this.line.delete();
            this.finished = true;
        }
        // todo
    }

    public handleMouseMove(x: number, y: number): void {
        if (this.line) {
            const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
            const t: number | null = ray.intersectScene(INSTANCE.getScene());
            if (t && t > 0.0) { // click intersected scene
                const point: Vec3 = ray.at(t);
                this.line.updateEnd(point);
            }
        }
    }

    public handleClick(x: number, y: number): void {

        const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
        const t: number | null = ray.intersectScene(INSTANCE.getScene());
        if (t && t > 0.0) { // click intersected scene
            const point: Vec3 = ray.at(t);
            if (this.line) {
                this.line.updateEnd(point);
                this.finished = true;
            } else {
                this.line = new Line(point, point, [1,0,0,1]);
            }
        }
    }

    public getInstructions(): string {
        if (this.line) {
            return "Exit:0  Click or type end point.  $";
        } else {
            return "Exit:0  Click or type start point.  $";
        }
    }

    public isFinished(): boolean {
        return this.finished;
    }


}
