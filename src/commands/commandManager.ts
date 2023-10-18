import { Command } from "./command";
import { CameraCommand } from "./commands/cameraCommand";
import { ConstructionPlaneCommand } from "./commands/constructionPlaneCommand";
import { toggleDarkMode } from "./oneTimeCommands/toggleDarkModeCommand";


export class CommandManager {

    private currentCommand: Command | null;
    private previousInput: string;

    constructor() {
        this.currentCommand = null;
        this.previousInput = "";
    }

    public handleInput(input: string) {

        input = input.toLowerCase();

        if (this.currentCommand) this.currentCommand.handleInput(input);
        else {
            switch (input) {
                case ".":
                    this.handleInput(this.previousInput);
                    return;
                case "darkmode": case "dm":
                    toggleDarkMode();
                    break;
                case "constructionplane": case "cp":
                    this.currentCommand = new ConstructionPlaneCommand();
                    break;
                case "camera": case "cam":
                    this.currentCommand = new CameraCommand();
                    break;
                default: console.log("Invalid Command");
            }
        }

        if (this.currentCommand?.isFinished()) {
            this.currentCommand = null;
        }

        this.previousInput = input;

    }

    public getInstructions(): string {
        if (this.currentCommand) return this.currentCommand!.getInstructions();
        return "$";
    }

    public tick(): void {
        this.currentCommand?.tick();
    }


}
