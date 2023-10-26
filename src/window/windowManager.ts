
export const WINDOW_NAMES: string[] = [

];

export class WindowManager {

  private windows: Map<string, Window>;

  constructor() {
    this.windows = new Map<string, Window>();
  }

  public getWindows(): Map<string, Window> {
    return this.windows;
  }

  public tick(): void {

  }

}
