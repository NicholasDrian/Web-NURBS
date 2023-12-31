import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { splitCurve } from "../../geometry/nurbs/splitCurve";
import { Points } from "../../geometry/points";
import { Ray } from "../../geometry/ray";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum SplitCurveCommandMode {
  SelectCurve,
  SelectSplitPoint,
}

export class SplitCurveCommand extends Command {

  private finished: boolean;
  private clicker: Clicker;
  private mode: SplitCurveCommandMode;
  private showSuggestions: boolean;
  private suggestedPoints: Points | null;
  private curve: Curve | null;
  private filteredKnots: number[];

  constructor() {
    super();
    this.finished = false;
    this.clicker = new Clicker();
    this.mode = SplitCurveCommandMode.SelectCurve;
    this.showSuggestions = true;
    this.suggestedPoints = null;
    this.curve = null;
    this.filteredKnots = [];
    INSTANCE.getSelector().reset();
  }

  handleInputString(input: string): void {
    if (input == "0") {
      this.done();
    }
    if (this.mode === SplitCurveCommandMode.SelectSplitPoint) {
      if (input == "1") {
        this.showSuggestions = !this.showSuggestions;
        if (this.showSuggestions) {
          this.generateSuggestionPoints();
        } else {
          if (this.suggestedPoints) {
            this.suggestedPoints!.delete();
            INSTANCE.getScene().removeGeometry(this.suggestedPoints!);
            this.suggestedPoints = null;
          }
        }
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case SplitCurveCommandMode.SelectCurve:
        this.curve = <Curve>intersection.geometry;
        this.curve.select();
        this.generateSuggestionPoints();
        this.mode = SplitCurveCommandMode.SelectSplitPoint;
        break;
      case SplitCurveCommandMode.SelectSplitPoint:
        if (this.suggestedPoints && intersection.geometry === this.suggestedPoints) {
          var u: number = this.filteredKnots[intersection.objectSubID];
        } else {
          intersection.transform(mat4.inverse(this.curve!.getModelRecursive()), new Ray([0, 0, 0], [0, 0, 1]));
          var u: number = this.curve!.getU(intersection);
        }
        const res: [Curve, Curve] = splitCurve(this.curve!, u);
        INSTANCE.getScene().addGeometry(res[0]);
        INSTANCE.getScene().addGeometry(res[1]);
        this.done();
        break;
      default:
        throw new Error("case not implemented");
    }
    this.clicker.reset();
  }

  private generateSuggestionPoints() {
    const knots: number[] = this.curve!.getKnots();
    const min: number = knots[0];
    const max: number = knots.at(-1)!;
    this.filteredKnots = [];
    var prevKnot: number = NaN;

    for (const knot of knots) {
      if (knot === min) continue;
      if (knot === max) continue;
      if (knot === prevKnot) continue;
      this.filteredKnots.push(knot);
      prevKnot = knot;
    }

    if (this.filteredKnots.length === 0) return;
    const pointsAtKnots: Vec3[] = [];
    const model: Mat4 = this.curve!.getModelRecursive();
    for (const knot of this.filteredKnots) {
      pointsAtKnots.push(vec3.transformMat4(this.curve!.sample(knot), model));
    }

    this.suggestedPoints = new Points(null, pointsAtKnots);
    INSTANCE.getScene().addGeometry(this.suggestedPoints);
  }

  handleClick(): void {
    switch (this.mode) {
      case SplitCurveCommandMode.SelectCurve:
        this.clicker.click(["curve"]);
        break;
      case SplitCurveCommandMode.SelectSplitPoint:
        const ids: number[] = [this.curve!.getID()];
        if (this.suggestedPoints) ids.push(this.suggestedPoints.getID());
        this.clicker.click(undefined, ids);
        break;
      default:
        throw new Error("case not implemented");
    }
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove();
  }

  getInstructions(): string {
    switch (this.mode) {
      case SplitCurveCommandMode.SelectCurve:
        return "0:Exit  Select curve to split.  $";
      case SplitCurveCommandMode.SelectSplitPoint:
        if (this.showSuggestions) {
          return "0:Exit  1:HideSuggestions  Select split point.  $";
        } else {
          return "0:Exit  1:ShowSuggestions  Select split point.  $";
        }
      default:
        throw new Error("case not implemented");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    this.curve?.unSelect();
    if (this.suggestedPoints) {
      this.suggestedPoints.delete();
      INSTANCE.getScene().removeGeometry(this.suggestedPoints);
    }
  }

}
