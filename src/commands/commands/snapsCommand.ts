import { INSTANCE } from "../../cad";
import { SnapSettings } from "../../settings/snapsManager";
import { Command } from "../command";

export class SnapsCommand extends Command {

  private finished: boolean;

  constructor() {
    super();
    this.finished = false;
  }

  override handleInput(input: string): void {
    switch (input) {
      case "0":
        this.finished = true;
        break;
      default:
        this.toggleSnap(input);
    }
  }

  private toggleSnap(input: string): void {
    const snapSettings: SnapSettings = INSTANCE.getSettingsManager().getSnapSettingsManager().getSnapSettings();
    switch (input) {
      case "1":
        snapSettings.snapGrid = !snapSettings.snapGrid;
        break;
      case "2":
        snapSettings.snapLine = !snapSettings.snapLine;
        break;
      case "3":
        snapSettings.snapPoint = !snapSettings.snapPoint;
        break;
    }
  }

  override handleClick(x: number, y: number): void {

  }

  override  handleMouseMove(x: number, y: number): void {

  }

  override getInstructions(): string {
    const snapSettings: SnapSettings = INSTANCE.getSettingsManager().getSnapSettingsManager().getSnapSettings();
    const grid: string = snapSettings.snapGrid ? "on" : "off";
    const point: string = snapSettings.snapPoint ? "on" : "off";
    const line: string = snapSettings.snapLine ? "on" : "off";
    return `Exit:0  Grid(${grid}):1  Line(${line}):2  Point(${point}):3  $`;
  }

  override isFinished(): boolean {
    return this.finished;
  }

}
