import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Ray } from "../../geometry/ray";
import { Command } from "../command";

export class lineCommand extends Command {

    private finished: boolean;

    constructor() {
        super();
        this.finished = false;
    }

    public handleInput(intput: string): void {
    }

    public handleClick(x: number, y: number): void {

        const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
        const t: number | null = ray.intersectScene(INSTANCE.getScene());
        if (t && t > 0.0) { // click intersected scene
            const point: Vec3 = ray.at(t);

        }
    }

    public getInstructions(): string {
        return "Line!";
    }

    public isFinished(): boolean {
        return this.finished;
    }

    public tick(): void {

    }


}
