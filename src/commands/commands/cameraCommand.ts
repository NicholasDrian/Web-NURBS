import { INSTANCE } from "../../cad";

enum CameraCommandMode {
    Menu,
    Fovy,
}

export class CameraCommand {

    private mode: CameraCommandMode;
    private finished: boolean;

    constructor() {
        this.mode = CameraCommandMode.Menu;
        this.finished = false;
    }

    public handleInput(input: string): void {
        switch (this.mode) {
            case CameraCommandMode.Menu:
                this.handleMenuInput(input);
                break;
            case CameraCommandMode.Fovy:
                this.handleFovyInput(input);
                break;
        }
    }

    public handleClick(x: number, y: number): void {

    }

    public handleMouseMove(x: number, y: number): void {

    }

    public getInstructions(): string {
        const fovy: number = INSTANCE.getScene().getCamera().getFovy();
        const fovyDegrees: string = (180.0 * fovy / Math.PI).toFixed(1);
        switch (this.mode) {
            case CameraCommandMode.Menu:
                return `0:Exit,  1:FOVY(${fovyDegrees})  $`;
            case CameraCommandMode.Fovy:
                return `0:Exit,  Enter New FOVY(${fovyDegrees})  $`;
            default:
                console.error("Unimplemented CameraCommandMode");
                return "";
        }
    }

    public isFinished(): boolean {
        return this.finished;
    }

    private handleFovyInput(input: string) {
        const inputNum: number | undefined  = parseFloat(input);
        if (inputNum === 0) {
            this.mode = CameraCommandMode.Menu;
        }
        if (inputNum) {
            INSTANCE.getScene().getCamera().setFovy(Math.PI * inputNum / 180.0);
            this.mode = CameraCommandMode.Menu;
        }
    }

    private handleMenuInput(input: string) {
        switch(input) {
            case "0": case "exit":
                this.finished = true;
                break;
            case "1": case "fovy":
                this.mode = CameraCommandMode.Fovy;
                break;
        }
    }


}
