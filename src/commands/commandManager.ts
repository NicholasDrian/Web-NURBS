import { INSTANCE } from "../cad";
import { Command } from "./command";
import { CameraCommand } from "./commands/cameraCommand";
import { ConstructionPlaneCommand } from "./commands/constructionPlaneCommand";
import { lineCommand } from "./commands/lineCommand";
import { toggleDarkMode } from "./oneTimeCommands/toggleDarkModeCommand";


export class CommandManager {

    private currentCommand: Command | null;
    private previousInput: string;

    constructor() {
        this.currentCommand = null;
        this.previousInput = "";
    }

    public handleInput(input: string) {

        INSTANCE.getLog().log(input);

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
                case "showlog": case "sl":
                    INSTANCE.getLog().show();
                    break;
                case "hidelog": case "hl":
                    INSTANCE.getLog().hide();
                    break;
                case "showstats": case "ss":
                    INSTANCE.getStats().show();
                    break;
                case "hidestats": case "hs":
                    INSTANCE.getStats().hide();
                    break;
                case "line": case "ln":
                    this.currentCommand = new lineCommand();
                    break;
                default: INSTANCE.getLog().log("Invalid Command");
            }
        }

        if (this.currentCommand?.isFinished()) {
            this.currentCommand = null;
        }

        this.previousInput = input;

    }

    handleClickInput(event: MouseEvent) {
        this.currentCommand?.handleClick(event.clientX, event.clientY);
    }

    public getInstructions(): string {
        if (this.currentCommand) return this.currentCommand!.getInstructions();
        return "$";
    }

    public tick(): void {
        this.currentCommand?.tick();
    }


}
