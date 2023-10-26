import { SnapSettingsManager } from "./snapsManager";

export class SettingsManager {

  private snapSettingsManager: SnapSettingsManager;

  constructor() {
    this.snapSettingsManager = new SnapSettingsManager();
  }

  public getSnapSettingsManager(): SnapSettingsManager {
    return this.snapSettingsManager;
  }

}
