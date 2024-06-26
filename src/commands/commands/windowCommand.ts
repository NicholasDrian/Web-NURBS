import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { cursor } from "../../widgets/cursor";
import { WINDOW_NAMES } from "../../window/windowManager";
import { Command } from "../command";

enum WindowCommandMode {
  SelectWindow,
  PlaceWindowStartOrRemoveWindow,
  PlaceWindowEnd,
}

export class WindowCommand extends Command {

  private finished: boolean;
  private mode: WindowCommandMode;
  private windowName: string = "none";

  constructor() {
    super();
    this.finished = false;
    this.mode = WindowCommandMode.SelectWindow;
    cursor.show();
  }

  public override handleClickResult(input: Intersection): void {
  }

  public override handleInputString(input: string): void {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        if (input == "0") {
          cursor.hide();
          this.finished = true;
          break;
        }
        if (WINDOW_NAMES.has(parseInt(input))) {
          this.windowName = WINDOW_NAMES.get(parseInt(input))!;
          this.mode = WindowCommandMode.PlaceWindowStartOrRemoveWindow;

          // remove existing window to add it back
          INSTANCE.getWindowManager().removeWindow(this.windowName);
        }
        break;
      case WindowCommandMode.PlaceWindowStartOrRemoveWindow:
        if (input == "1") {
          this.mode = WindowCommandMode.SelectWindow;
        }
        break;
      case WindowCommandMode.PlaceWindowEnd:
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  // rounds n to nearest multiple of m
  private nearestMultiple(n: number, m: number): number {
    const delta = n % m;
    if (delta < m / 2) n -= delta;
    else n += m - delta;
    return n;
  }

  private roundScreenPoint(p: [number, number]): [number, number] {
    return [this.nearestMultiple(p[0], 10), this.nearestMultiple(p[1], 10)];
  }

  public override handleClick(): void {
    const [x, y] = this.roundScreenPoint(INSTANCE.getEventManager().getMouseHandler().getMousePos());
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        break;
      case WindowCommandMode.PlaceWindowStartOrRemoveWindow:
        INSTANCE.getWindowManager().addWindow(this.windowName, [x, y]);
        this.mode = WindowCommandMode.PlaceWindowEnd;
        break;
      case WindowCommandMode.PlaceWindowEnd:
        INSTANCE.getWindowManager().getWindows().get(this.windowName)!.updateEnd([x, y]);
        this.windowName = "none";
        this.mode = WindowCommandMode.SelectWindow;
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public override handleMouseMove(): void {
    const [x, y] = this.roundScreenPoint(INSTANCE.getEventManager().getMouseHandler().getMousePos());
    cursor.setPosition([x, y]);
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        break;
      case WindowCommandMode.PlaceWindowStartOrRemoveWindow:
        break;
      case WindowCommandMode.PlaceWindowEnd:
        INSTANCE.getWindowManager().getWindows().get(this.windowName)!.updateEnd([x, y]);
        break;
      default:
        throw new Error("Not implemented");
    }
  }

  public override getInstructions(): string {
    switch (this.mode) {
      case WindowCommandMode.SelectWindow:
        var res: string = "0:Exit  ";
        for (let [key, value] of WINDOW_NAMES) {
          res += key.toString() + ":" + value + " ";
        }
        return res + "$";
      case WindowCommandMode.PlaceWindowStartOrRemoveWindow:
        return "0:Exit  1:Remove  Click first corner for window.";
      case WindowCommandMode.PlaceWindowEnd:
        return "0:Exit  Click second corner for window.";
      default:
        throw new Error("Not implemented");
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }

}
