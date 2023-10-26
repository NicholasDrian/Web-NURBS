import { CADWindow } from "./window";
import { LogWindow } from "./windows/logWindow";
import { MaterialsWindow } from "./windows/materialsWindow";
import { SceneWindow } from "./windows/sceneWindow";
import { SnapsWindow } from "./windows/snapsWindow";
import { StatsWindow } from "./windows/statsWindow";

export const WINDOW_NAMES: string[] = [
  "stats",
  "log",
  "materials",
  "scene",
  "snaps",
];

export class WindowManager {

  private windows: Map<string, CADWindow>;

  constructor() {
    this.windows = new Map<string, CADWindow>();
  }

  public getWindows(): Map<string, CADWindow> {
    return this.windows;
  }

  public addWindow(windowName: string) {
    switch (windowName) {
      case "stats":
        this.windows.set("stats", new StatsWindow());
        break;
      case "log":
        this.windows.set("log", new LogWindow());
        break;
      case "materials":
        this.windows.set("materials", new MaterialsWindow());
        break;
      case "scene":
        this.windows.set("scene", new SceneWindow());
        break;
      case "snaps":
        this.windows.set("snaps", new SnapsWindow());
        break;
      default:
        throw new Error("not implemented");
    }
  }

  public tick(): void {

  }

}
