

export class SnapSettings {

  snapGrid: boolean = false;
  snapLine: boolean = false;
  snapPoint: boolean = false;
  snapScreenPercent: boolean = false;

}


export class SnapSettingsManager {

  private stack: SnapSettings[];

  constructor() {
    this.stack = [new SnapSettings()];
  }

  public push(): void {
    this.stack.push(new SnapSettings());
  }

  public pop(): void {
    this.stack.pop();
  }

  public getSnapSettings(): SnapSettings {
    return this.stack.at(-1)!;
  }

  public getHTML(): string {
    const settings: SnapSettings = this.stack.at(-1)!;
    console.log("here");
    console.log(`
      <u>SNAPS:</u><br>
      <br>
      grid(${settings.snapGrid ? "on" : "off"})<br>
      line(${settings.snapLine ? "on" : "off"})<br>
      point(${settings.snapPoint ? "on" : "off"})<br>
    `);
    return `
      <u>SNAPS:</u><br>
      <br>
      grid(${settings.snapGrid ? "on" : "off"})<br>
      line(${settings.snapLine ? "on" : "off"})<br>
      point(${settings.snapPoint ? "on" : "off"})<br>
    `;
  }

}