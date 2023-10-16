import { Command } from "../command"


enum ConstructionPlaneCommandMode {
    Menu,
    ChangeMajorCount,
    ChangeMinorCount,
    ChangeSpacing,
}

export class ConstructionPlaneCommand extends Command {

    private mode: ConstructionPlaneCommandMode;
    private finished: boolean;

    constructor() {
        super();
        this.mode = ConstructionPlaneCommandMode.Menu;
        this.finished = false;
    }

    public handleInput(input: string): void {
        switch(this.mode) {
            case ConstructionPlaneCommandMode.Menu:
                this.handleMenuInput(input);
                break;
            case ConstructionPlaneCommandMode.ChangeMajorCount:
                break;
            case ConstructionPlaneCommandMode.ChangeMinorCount:
                break
            case ConstructionPlaneCommandMode.ChangeSpacing:
                break
            default: console.error("Unhandled Mode");
        }
    }

    public handleClick(x: number, y: number): void {

    }

    public getInstructions(): string {
        switch(this.mode) {
            case ConstructionPlaneCommandMode.Menu:
                return "0:Exit  1:MajorCount  2:Minor Count  3:Spacing  $";
            case ConstructionPlaneCommandMode.ChangeMajorCount:
                return "New Major Count: ";
            case ConstructionPlaneCommandMode.ChangeMinorCount:
                return "0:Exit, New Minor Count: ";
            case ConstructionPlaneCommandMode.ChangeSpacing:
                return "0:Exit, New Spacing: ";
            default: console.error("Unhandled Mode");
        }
        return "";
    }

    public isFinished(): boolean {
        return this.finished;
    }

    public tick(): void {

    }

    private handleMenuInput(input: string): void {
        switch(input) {
            case "0":
                this.finished = true;
                return;
            case "1":
                this.mode = ConstructionPlaneCommandMode.ChangeMajorCount;
                return;
            case "2":
                this.mode = ConstructionPlaneCommandMode.ChangeMinorCount;
                return;
            case "3":
                this.mode = ConstructionPlaneCommandMode.ChangeSpacing;
                return;
        }
    }


}
