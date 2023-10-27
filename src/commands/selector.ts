import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";



export class Selector {

  private point: Vec3 | null;
  private intersectionScreenPos: [number, number];
  private cursor: [HTMLDivElement, HTMLDivElement];

  constructor() {
    this.point = null;
    this.intersectionScreenPos = [-1, -1];
    this.cursor = this.createCursor();
    this.onMouseMove();
  }

  public onMouseMove(): void {
    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    this.intersectionScreenPos = mousePos; // TODO: intersect scene
    this.draw();
  }

  public getPoint(): Vec3 | null {
    return this.point;
  }

  private draw(): void {
    this.cursor[0].style.left = (this.intersectionScreenPos[0]).toString() + "px";
    this.cursor[0].style.top = (this.intersectionScreenPos[1] - 5).toString() + "px";
    this.cursor[1].style.left = (this.intersectionScreenPos[0] - 5).toString() + "px";
    this.cursor[1].style.top = (this.intersectionScreenPos[1]).toString() + "px";
  }

  public destroy(): void {
    document.body.removeChild(this.cursor[0]);
    document.body.removeChild(this.cursor[1]);
    console.log("destroying");
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
