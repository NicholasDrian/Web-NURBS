import { INSTANCE } from "../cad";



export class MouseHandler {

  private mousePos: [number, number];
  private mouseDown: boolean;
  private shiftDown: boolean;
  private controlDown: boolean;
  private metaDown: boolean;
  private drag: Drag | null;

  constructor() {
    this.mousePos = [-1, -1];
    this.mouseDown = false;
    this.shiftDown = false;
    this.controlDown = false;
    this.metaDown = false;
    this.drag = null;
  }

  public onMouseMove(event: MouseEvent): void {
    this.mousePos = [event.clientX, event.clientY];
    this.drag?.update(event.clientX, event.clientY);
    INSTANCE.getCommandManager().handleMouseMove();
    INSTANCE.getMover().onMouseMove();
  }

  public onMouseDown(event: MouseEvent): void {
    if (event.button == 0) { // left click

      if (!INSTANCE.getCommandManager().hasActiveCommand()) {
        // forward clicked id to mover incase mover was clicked
        INSTANCE.getRenderer().getIdAtPixel(event.clientX, event.clientY).then((id: number) => {
          if (id === 0) {
            this.drag = new Drag(event.clientX, event.clientY);
            this.mouseDown = true;
            this.shiftDown = event.shiftKey;
            this.controlDown = event.ctrlKey;
            this.metaDown = event.metaKey;
          } else {
            INSTANCE.getMover().idClicked(id);
          }
        });
      } else {
        this.drag = new Drag(event.clientX, event.clientY);
        this.mouseDown = true;
        this.shiftDown = event.shiftKey;
        this.controlDown = event.ctrlKey;
        this.metaDown = event.metaKey;
      }

    }
  }

  public onMouseUp(event: MouseEvent): void {
    if (event.button === 0) { // left button
      if (this.drag && !this.drag.isDrag()) { // click
        if (INSTANCE.getCommandManager().hasActiveCommand()) { // forward click to active command
          INSTANCE.getCommandManager().handleClickInput();
          INSTANCE.getCli().render();
        } else {
          if (!INSTANCE.getMover().isActive()) {
            if (!this.shiftDown) INSTANCE.getSelector().reset();
            INSTANCE.getSelector().toggleSelectionAtPixel(event.clientX, event.clientY, this.metaDown);
          }
        }
      } else { // drag
        if (!INSTANCE.getMover().isActive() && !INSTANCE.getCommandManager().hasActiveCommand()) {
          if (this.drag) { // should be set unless i inspected element
            if (!this.shiftDown) INSTANCE.getSelector().reset();
            const inclusive: boolean = this.drag!.isLeftward();
            INSTANCE.getSelector().selectInRectangle(...this.drag!.getBounds(), inclusive, this.metaDown);
          }
        }
      }
      this.drag?.destroy();
      this.drag = null;
      this.mouseDown = false;
    }
    INSTANCE.getMover().onMouseUp();
  }

  public getMousePos(): [number, number] {
    return this.mousePos;
  }
}

class Drag {

  private x2!: number;
  private y2!: number;
  private element: HTMLDivElement;

  constructor(
    private x1: number,
    private y1: number,
  ) {
    this.element = <HTMLDivElement>document.getElementById("selection-rectangle");
    this.update(this.x1, this.y1);
    this.element.hidden = false;
  }

  public update(x: number, y: number): void {
    this.x2 = x;
    this.y2 = y;

    const top = Math.min(this.y1, this.y2);
    const bottom = Math.max(this.y1, this.y2);
    const left = Math.min(this.x1, this.x2);
    const right = Math.max(this.x1, this.x2);

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    this.element.style.width = `${right - left}px`;
    this.element.style.height = `${bottom - top}px`;
  }

  public isDrag(): boolean {
    return this.x1 != this.x2 || this.y1 != this.y2;
  }

  public isLeftward(): boolean {
    return this.x2 < this.x1;
  }

  public getBounds(): [number, number, number, number] {
    return [
      Math.min(this.x1, this.x2),
      Math.max(this.x1, this.x2),
      Math.min(this.y1, this.y2),
      Math.max(this.y1, this.y2),
    ]
  }

  public destroy(): void {
    this.element.hidden = true;
  }




}
