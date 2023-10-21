import { INSTANCE } from "../cad";

export class CLI {

    private element: HTMLDivElement;
    private input: string;

    constructor() {
        this.element = <HTMLDivElement> document.getElementById("cli");
        this.input = "";
        this.render();
    }

    public show(): void {
        this.element.hidden = false;
    }
    public hide(): void {
        this.element.hidden = true;
    }

    public processKeyDownEvent(event: KeyboardEvent) {
        if (event.key == "Enter") {
            INSTANCE.getCommandManager().handleInput(this.input);
            this.clearInput();
        } else if (event.key == "Escape") {
            INSTANCE.getCommandManager().handleInput("Escape");
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

    public render(): void {
        this.element.innerText = INSTANCE.getCommandManager().getInstructions() + this.input;
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

