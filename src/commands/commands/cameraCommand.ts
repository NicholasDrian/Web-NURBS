import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Command } from "../command";

enum CameraCommandMode {
  Menu,
  Fovy,
}

export class CameraCommand extends Command {

  private mode: CameraCommandMode;
  private finished: boolean;

  constructor() {
    super();
    this.mode = CameraCommandMode.Menu;
    this.finished = false;
  }

  public override handleInputString(input: string): void {
    switch (this.mode) {
      case CameraCommandMode.Menu:
        this.handleMenuInput(input);
        break;
      case CameraCommandMode.Fovy:
        this.handleFovyInput(input);
        break;
    }
  }

  public override handleClick(): void {

  }

  public override handleMouseMove(): void {

  }

  public override handleClickResult(input: Intersection): void {
  }

  public override getInstructions(): string {
    const fovy: number = INSTANCE.getScene().getCamera().getFovy();
    const fovyDegrees: string = (180.0 * fovy / Math.PI).toFixed(1);
    switch (this.mode) {
      case CameraCommandMode.Menu:
        return `0:Exit,  1:FOVY(${fovyDegrees})  $`;
      case CameraCommandMode.Fovy:
        return `0:Exit,  Enter New FOVY(${fovyDegrees})  $`;
      default:
        console.error("Unimplemented CameraCommandMode");
        return "";
    }
  }

  public override isFinished(): boolean {
    return this.finished;
  }

  private handleFovyInput(input: string) {
    const inputNum: number | undefined = parseFloat(input);
    if (inputNum === 0) {
      this.mode = CameraCommandMode.Menu;
    }
    if (inputNum) {
      INSTANCE.getScene().getCamera().setFovy(Math.PI * inputNum / 180.0);
      this.mode = CameraCommandMode.Menu;
    }
  }

  private handleMenuInput(input: string) {
    switch (input) {
      case "0": case "exit":
        this.finished = true;
        break;
      case "1": case "fovy":
        this.mode = CameraCommandMode.Fovy;
        break;
    }
  }



}
