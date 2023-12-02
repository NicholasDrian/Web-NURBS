import { CADWindow } from "./window";
import { LogWindow } from "./windows/logWindow";
import { MaterialsWindow } from "./windows/materialsWindow";
import { SceneWindow } from "./windows/sceneWindow";
import { SnapsWindow } from "./windows/snapsWindow";
import { StatsWindow } from "./windows/statsWindow";

export const WINDOW_NAMES: Map<number, string> = new Map<number, string>();
WINDOW_NAMES.set(1, "stats");
WINDOW_NAMES.set(2, "log");
WINDOW_NAMES.set(3, "materials");
WINDOW_NAMES.set(4, "scene");
WINDOW_NAMES.set(5, "snaps");

export class WindowManager {

  private windows: Map<string, CADWindow>;

  constructor() {
    this.windows = new Map<string, CADWindow>();
    this.setupDefaultWindows();
  }

  private setupDefaultWindows(): void {
    this.addWindow("materials", [10, 10], [210, 560]);
    this.addWindow("stats", [220, 10], [410, 240]);
    this.addWindow("snaps", [420, 10], [550, 100]);
  }

  public getWindows(): Map<string, CADWindow> {
    return this.windows;
  }

  public addWindow(windowName: string, start: [number, number], end?: [number, number]) {
    this.removeWindow(windowName);
    switch (windowName) {
      case "stats":
        this.windows.set("stats", new StatsWindow(windowName, start, end ?? start));
        break;
      case "log":
        this.windows.set("log", new LogWindow(windowName, start, end ?? start));
        break;
      case "materials":
        this.windows.set("materials", new MaterialsWindow(windowName, start, end ?? start));
        break;
      case "scene":
        this.windows.set("scene", new SceneWindow(windowName, start, end ?? start));
        break;
      case "snaps":
        this.windows.set("snaps", new SnapsWindow(windowName, start, end ?? start));
        break;
      default:
        throw new Error("not implemented");
    }
  }

  public removeWindow(windowName: string): void {
    this.windows.get(windowName)?.destroy();
    this.windows.delete(windowName);
  }

  public tick(): void {
    for (let window of this.windows.values()) {
      window.tick();
    }
  }

}
