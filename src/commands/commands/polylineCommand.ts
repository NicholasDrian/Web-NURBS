import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { PolyLine } from "../../geometry/polyLine";
import { Ray } from "../../geometry/ray";
import { Command } from "../command";

export class PolyLineCommand extends Command {

    private polyline: PolyLine | null;
    private finished: boolean;

    constructor() {
        super();
        this.polyline = null;
        this.finished = false;
    }

    public handleInput(input: string): void {
        switch (input) {
            case "0":
                if (this.polyline) this.polyline.delete();
                this.finished = true;
            case "":
                if (this.polyline) {
                    if (this.polyline.getSegmentCount() < 2) this.polyline.delete();
                    else this.polyline.removeLastPoint();
                }
                this.finished = true;
                break;
        }
    }

    public handleClick(x: number, y: number): void {
        const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
        const t: number | null = ray.intersectScene(INSTANCE.getScene());
        if (t && t > 0.0) { // click intersected scene
            const point: Vec3 = ray.at(t);
            if (this.polyline) {
                this.polyline.updateLastPoint(point);
                this.polyline.addPoint(point);
            } else {
                this.polyline = new PolyLine([point, point], [1,0,0,1]);
            }
        }

    }

    public handleMouseMove(x: number, y: number): void {
        if (this.polyline) {
            const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
            const t: number | null = ray.intersectScene(INSTANCE.getScene());
            if (t && t > 0.0) { // click intersected scene
                const point: Vec3 = ray.at(t);
                this.polyline.updateLastPoint(point);
            }
        }
    }

    public getInstructions(): string {
        if (this.polyline) {
            return "Exit:0  click or type next point  $";
        } else {
            return "Exit:0  click or type start point  $";
        }
    }

    public isFinished(): boolean {
        return this.finished;
    }


}
