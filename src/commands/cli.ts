import { CommandManager } from "./commandManager";

export class CLI {

    private element: HTMLDivElement;
    private input: string;
    private commandManager: CommandManager;

    constructor() {
        this.element = <HTMLDivElement> document.getElementById("cli");
        this.commandManager = new CommandManager();
        this.input = "";
        this.render();
    }

    public show(): void {
        this.element.style.opacity = "0";
    }
    public hide(): void {
        this.element.style.opacity = "1";
    }

    public processKeyDownEvent(event: KeyboardEvent) {
        if (event.key == "Enter") {
            this.commandManager.handleInput(this.input);
            this.clearInput();
        } else if (event.key == "Escape") {
            this.commandManager.handleInput("Escape");
            this.clearInput();
        } else if (event.key == "Backspace") {
            this.deleteLast();
        } else if (event.key.length == 1) {
            this.addChar(event.key);
        }
    }


    public hasInput(): boolean {
        return this.input != "";
    }

    public clearInput(): void {
        this.input = "";
        this.render();
    }

    private render(): void {
        this.element.innerText = this.commandManager.getInstructions() + this.input;
    }

    private deleteLast(): void {
        if (this.input.length) {
            this.input = this.input.slice(0, -1);
            this.render();
        }
    }

    private addChar(char: string): void {
        this.input += char;
        this.render();
    }

}

