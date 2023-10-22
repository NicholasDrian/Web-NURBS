import { PolyLine } from "../polyLine";


export class Curve {

    private controlCage: PolyLine;

    constructor() {
        this.controlCage = new PolyLine([], [0,0,0,0]);
    }


}
