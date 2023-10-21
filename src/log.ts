

export class Log {

    private element: HTMLDivElement;

    constructor() {

        this.element = <HTMLDivElement> document.getElementById("log");
        this.element.style.overflow = "scroll";

    }

    public log(text: string) {
        this.element.innerHTML +=  "<br>" + text;
        this.element.scrollTop = this.element.scrollHeight;
    }

    public show(): void {
        this.element.hidden = false;
    }

    public hide(): void {
        this.element.hidden = true;
    }



}
