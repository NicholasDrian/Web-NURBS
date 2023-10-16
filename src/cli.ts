
export class CLI {

    private element: HTMLDivElement;
    private prompt: string;
    private input: string;

    constructor() {
        this.element = <HTMLDivElement> document.getElementById("cli");
        this.prompt = "";
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
            console.log(this.input);
            this.clearInput();
        } else if (event.key == "Backspace") {
            this.input = this.input.slice(0, -1);
            this.render();
        } else if (event.key.length == 1) {
            this.input += event.key;
            this.render();
        }
    }

    public hasInput(): boolean {
        return this.input != "";
    }

    public clearInput(): void {
        this.input = "";
        this.render();
    }

    public setPrompt(prompt: string): void {
        this.prompt = prompt;
    }

    private render(): void {
        this.element.innerText = this.prompt + this.input;
    }

}

