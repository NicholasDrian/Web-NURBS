import { INSTANCE } from "../../cad";
import { Geometry } from "../../geometry/geometry";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { loft } from "../../geometry/nurbs/loft";
import { Surface } from "../../geometry/nurbs/surface";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum LoftCommandMode {
  SelectCurves,
  ChangeDegree,
}

export class LoftCommand extends Command {

  private finished: boolean;
  private degree: number;
  private clicker: Clicker;
  private mode: LoftCommandMode;
  private curves: Geometry[];

  constructor() {
    super();
    this.finished = false;
    this.degree = 1;
    this.clicker = new Clicker();
    this.mode = LoftCommandMode.SelectCurves;
    this.curves = [];
    INSTANCE.getSelector().reset();
  }

  handleInputString(input: string): void {

    if (input === "0") this.done();

    switch (this.mode) {
      case LoftCommandMode.SelectCurves:
        if (input == "1") {
          this.mode = LoftCommandMode.ChangeDegree;
        }
        if (input == "") {
          const curves: Curve[] = [];
          for (let curve of this.curves) {
            while (curve.getTypeName() != "Curve" && curve.getParent()) {
              curve = curve.getParent()!;
            }
            if (curve.getTypeName() == "Curve") {
              curves.push(<Curve>curve);
            }
          }
          if (curves.length < 2) this.done();
          this.degree = Math.min(this.degree, curves.length - 1);
          const surface: Surface = loft(curves, this.degree);
          INSTANCE.getScene().addGeometry(surface);
          this.done();
        }
        break;
      case LoftCommandMode.ChangeDegree:
        const inputNum: number | undefined = parseInt(input);
        if (inputNum) {
          this.degree = inputNum;
          this.mode = LoftCommandMode.SelectCurves;
        }
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  handleClickResult(intersection: Intersection): void {
    this.curves.push(intersection.geometry!);
    intersection.geometry!.select();
    this.clicker.reset();
  }

  handleClick(): void {
    this.clicker.click(["curve"]);
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
  }

  getInstructions(): string {
    switch (this.mode) {
      case LoftCommandMode.ChangeDegree:
        return `0:Exit  Enter new degree(${this.degree})  $`;
      case LoftCommandMode.SelectCurves:
        return `0:Exit  1:ChangeDegree(${this.degree})  Select curves.  $`;
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.clicker.destroy();
    for (const curve of this.curves) {
      curve.unSelect();
    }
    this.finished = true;
  }

}
