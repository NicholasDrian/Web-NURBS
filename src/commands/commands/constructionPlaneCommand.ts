import { INSTANCE } from "../../cad";
import { Command } from "../command"


enum ConstructionPlaneCommandMode {
  Menu,
  ChangeMajorCount,
  ChangeMinorCount,
  ChangeSpacing,
}

export class ConstructionPlaneCommand extends Command {

  private mode: ConstructionPlaneCommandMode;
  private finished: boolean;

  constructor() {
    super();
    this.mode = ConstructionPlaneCommandMode.Menu;
    this.finished = false;
  }

  public handleInput(input: string): void {
    switch (this.mode) {
      case ConstructionPlaneCommandMode.Menu:
        this.handleMenuInput(input);
        break;
      case ConstructionPlaneCommandMode.ChangeMajorCount:
        this.changeMajorCount(input);
        break;
      case ConstructionPlaneCommandMode.ChangeMinorCount:
        this.changeMinorCount(input);
        break
      case ConstructionPlaneCommandMode.ChangeSpacing:
        this.changeCellSize(input);
        break
      default: console.error("Unhandled Mode");
    }
  }

  public handleClick(x: number, y: number): void {

  }

  public getInstructions(): string {
    const constructionPlane = INSTANCE.getScene().getConstructionPlane();
    const minorCount: string = constructionPlane.getMinorCount().toString();
    const majorCount: string = constructionPlane.getMajorCount().toString();
    const cellSize: string = constructionPlane.getCellSize().toFixed(2);
    switch (this.mode) {
      case ConstructionPlaneCommandMode.Menu:
        return `0:Exit,  1:MajorCount(${majorCount}),  2:MinorCount(${minorCount}),  3:CellSize(${cellSize})  $`;
      case ConstructionPlaneCommandMode.ChangeMajorCount:
        return `0:Exit,  Enter New Major Count(${majorCount})  $`;
      case ConstructionPlaneCommandMode.ChangeMinorCount:
        return `0:Exit,  Enter New Minor Count(${minorCount})  $`;
      case ConstructionPlaneCommandMode.ChangeSpacing:
        return `0:Exit,  Enter New Cell Size(${cellSize})  $`;
      default: console.error("Unhandled Mode");
    }
    return "";
  }

  public isFinished(): boolean {
    return this.finished;
  }

  public handleMouseMove(x: number, y: number): void {

  }

  private handleMenuInput(input: string): void {
    switch (input) {
      case "0": case "exit":
        this.finished = true;
        return;
      case "1": case "majorcount":
        this.mode = ConstructionPlaneCommandMode.ChangeMajorCount;
        return;
      case "2": case "minorcount":
        this.mode = ConstructionPlaneCommandMode.ChangeMinorCount;
        return;
      case "3": case "cellspacing":
        this.mode = ConstructionPlaneCommandMode.ChangeSpacing;
        return;
    }
  }

  private changeMajorCount(input: string) {
    if (input === '0' || input === "exit") {
      this.mode = ConstructionPlaneCommandMode.Menu;
    }
    const count: number | undefined = parseInt(input);
    if (count) {
      INSTANCE.getScene().getConstructionPlane().setMajorCount(count);
      this.mode = ConstructionPlaneCommandMode.Menu;
    }
  }

  private changeMinorCount(input: string) {
    if (input === '0' || input === "exit") {
      this.mode = ConstructionPlaneCommandMode.Menu;
    }
    const count: number | undefined = parseInt(input);
    if (count) {
      INSTANCE.getScene().getConstructionPlane().setMinorCount(count);
      this.mode = ConstructionPlaneCommandMode.Menu;
    }
  }

  private changeCellSize(input: string) {
    if (input === '0' || input === "exit") {
      this.mode = ConstructionPlaneCommandMode.Menu;
    }
    const size: number | undefined = parseFloat(input);
    if (size) {
      INSTANCE.getScene().getConstructionPlane().setCellSize(size);
      this.mode = ConstructionPlaneCommandMode.Menu;
    }
  }

}
