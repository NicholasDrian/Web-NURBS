class Cursor {

  private cursor: [HTMLDivElement, HTMLDivElement];

  constructor() {
    this.cursor = this.createCursor();
  }

  public setPosition(pos: [number, number]): void {
    this.cursor[0].style.left = (pos[0]).toString() + "px";
    this.cursor[0].style.top = (pos[1] - 5).toString() + "px";
    this.cursor[1].style.left = (pos[0] - 5).toString() + "px";
    this.cursor[1].style.top = (pos[1]).toString() + "px";
  }

  public show(): void {
    this.cursor[0].hidden = false;
    this.cursor[1].hidden = false;
  }
  public hide(): void {
    this.cursor[0].hidden = true;
    this.cursor[1].hidden = true;
  }


  private createCursor(): [HTMLDivElement, HTMLDivElement] {
    const cursorVertical: HTMLDivElement = document.createElement("div");
    const cursorHorizontal: HTMLDivElement = document.createElement("div");
    cursorVertical.className = "floating-window";
    cursorVertical.style.borderRadius = "0px";
    cursorVertical.style.padding = "0px";
    cursorVertical.style.margin = "0px";
    cursorVertical.style.width = "0px";
    cursorVertical.style.height = "10px";
    cursorHorizontal.className = "floating-window";
    cursorHorizontal.style.borderRadius = "0px";
    cursorHorizontal.style.padding = "0px";
    cursorHorizontal.style.margin = "0px";
    cursorHorizontal.style.width = "10px";
    cursorHorizontal.style.height = "0px";
    document.body.appendChild(cursorVertical);
    document.body.appendChild(cursorHorizontal);
    const res: [HTMLDivElement, HTMLDivElement] = [cursorVertical, cursorHorizontal];
    return res;
  }


}

export const cursor: Cursor = new Cursor;
