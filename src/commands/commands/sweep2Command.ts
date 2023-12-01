import { Mat4, Vec3, vec3, vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Intersection } from "../../geometry/intersection";
import { Curve } from "../../geometry/nurbs/curve";
import { loft } from "../../geometry/nurbs/loft";
import { Surface } from "../../geometry/nurbs/surface";
import { matchDegrees, matchKnots } from "../../geometry/nurbs/utils";
import { changeOfBasis, lerp } from "../../utils/math";
import { Clicker } from "../clicker";
import { Command } from "../command";

enum Sweep2CommandMode {
  SelectPipe1,
  SelectPipe2,
  SelectCrossSection1,
  SelectCrossSection2,
  Preview,
}

export class Sweep2Command extends Command {

  private finished: boolean = false;
  private clicker: Clicker = new Clicker();
  private mode: Sweep2CommandMode = Sweep2CommandMode.SelectPipe1;
  private surface: Surface | null = null;
  private pipe1: Curve | null = null;
  private pipe2: Curve | null = null;
  private crossSection1: Curve | null = null;
  private crossSection2: Curve | null = null;
  private preserveHeight: boolean = false;

  constructor() {
    super();
    INSTANCE.getSelector().reset();
  }

  handleInputString(input: string): void {
    if (input == "0") {
      this.surface?.delete();
      this.surface = null;
      this.done();
    }
    if (this.mode === Sweep2CommandMode.Preview) {
      switch (input) {
        case "":
          this.done();
          break;
        case "1":
          this.preserveHeight = !this.preserveHeight;
          this.generateSurface();
          break;
      }
    }
  }

  handleClickResult(intersection: Intersection): void {
    switch (this.mode) {
      case Sweep2CommandMode.SelectPipe1:
        this.pipe1 = <Curve>intersection.geometry;
        this.pipe1.select();
        this.mode = Sweep2CommandMode.SelectPipe2;
        break;
      case Sweep2CommandMode.SelectPipe2:
        this.pipe2 = <Curve>intersection.geometry;
        this.pipe2.select();
        this.mode = Sweep2CommandMode.SelectCrossSection1;
        break;
      case Sweep2CommandMode.SelectCrossSection1:
        this.crossSection1 = <Curve>intersection.geometry;
        this.crossSection1.select();
        this.mode = Sweep2CommandMode.SelectCrossSection2;
        break;
      case Sweep2CommandMode.SelectCrossSection2:
        this.crossSection2 = <Curve>intersection.geometry;
        this.crossSection2.select();
        this.generateSurface();
        this.mode = Sweep2CommandMode.Preview;
        break;
      default:
        throw new Error("case not handled");
    }
    this.clicker.reset();
  }

  handleClick(): void {
    this.clicker.click(["curve"]);
  }

  handleMouseMove(): void {
    this.clicker.onMouseMove(["curve"]);
  }

  getInstructions(): string {
    switch (this.mode) {
      case Sweep2CommandMode.SelectPipe1:
        return "0:Exit  Select pipe 1.  $";
      case Sweep2CommandMode.SelectPipe2:
        return "0:Exit  Select pipe 2.  $";
      case Sweep2CommandMode.SelectCrossSection1:
        return "0:Exit  Select cross section 1.  $";
      case Sweep2CommandMode.SelectCrossSection2:
        return "0:Exit  Select cross section 2.  $";
      case Sweep2CommandMode.Preview:
        return `0:Exit  1:PreserveHeight(${this.preserveHeight ? "True" : "False"})  $`;
      default:
        throw new Error("case not handled");
    }
  }

  isFinished(): boolean {
    return this.finished;
  }

  private generateSurface(): void {
    this.surface?.delete();

    // create clones
    const p1: Curve = <Curve>this.pipe1!.clone();
    const p2: Curve = <Curve>this.pipe2!.clone();
    const c1: Curve = <Curve>this.crossSection1!.clone();
    const c2: Curve = <Curve>this.crossSection2!.clone();

    // Match degrees
    matchDegrees([p1, p2]);
    matchDegrees([c1, c2]);

    // Match knots
    matchKnots([p1, p2]);
    matchKnots([c1, c2]);

    // Align directions
    const face = (a: Curve, b: Curve, c: Curve) => {
      // make a face b not c
      const aEnd: Vec3 = a.getEndPoint();
      const bStart: Vec3 = b.getStartPoint();
      const bEnd: Vec3 = b.getEndPoint();
      const cStart: Vec3 = c.getStartPoint();
      const cEnd: Vec3 = c.getEndPoint();
      const distB: number = Math.min(vec3.dist(aEnd, bEnd), vec3.dist(aEnd, bStart));
      const distC: number = Math.min(vec3.dist(aEnd, cEnd), vec3.dist(aEnd, cStart));
      if (distC < distB) a.reverse();
    };
    face(c1, p2, p1);
    face(c2, p2, p1);
    face(p1, c2, c1);
    face(p2, c2, c1);

    // create new controls 

    const p1Controls: Vec3[] = p1.getControlPoints();
    const p2Controls: Vec3[] = p2.getControlPoints();

    const controls: Curve[] = [];

    const c1Controls: Vec4[] = c1.getWeightedControlPoints();
    const c2Controls: Vec4[] = c2.getWeightedControlPoints();

    const fromO1Start: Vec3 = p1.getStartPoint();
    const fromO2Start: Vec3 = p2.getStartPoint();
    const fromY1Start: Vec3 = vec3.sub(fromO2Start, fromO1Start);
    const fromY2Start: Vec3 = fromY1Start;
    const fromX1Start: Vec3 = vec3.scale(p1.getStartRay().getDirection(), -1);
    const fromX2Start: Vec3 = vec3.scale(p2.getStartRay().getDirection(), -1);
    const fromZ1Start: Vec3 = vec3.cross(fromX1Start, fromY1Start);
    const fromZ2Start: Vec3 = vec3.cross(fromX2Start, fromY2Start);

    const fromO1End: Vec3 = p1.getEndPoint();
    const fromO2End: Vec3 = p2.getEndPoint();
    const fromY1End: Vec3 = vec3.sub(fromO2End, fromO1End);
    const fromY2End: Vec3 = fromY1End;
    const fromX1End: Vec3 = p1.getEndRay().getDirection();
    const fromX2End: Vec3 = p2.getEndRay().getDirection();
    const fromZ1End: Vec3 = vec3.cross(fromX1End, fromY1End);
    const fromZ2End: Vec3 = vec3.cross(fromX2End, fromY2End);

    const c1Ratios: number[] = [];
    const c2Ratios: number[] = [];
    for (let i = 0; i < c1.getControlPointCount(); i++) {
      const c1StartDist: number = vec3.distance(c1Controls[i], c1Controls[0]);
      const c1EndDist: number = vec3.distance(c1Controls[i], c1Controls.at(-1)!);
      c1Ratios.push(c1StartDist / (c1StartDist + c1EndDist));

      const c2StartDist: number = vec3.distance(c2Controls[i], c2Controls[0]);
      const c2EndDist: number = vec3.distance(c2Controls[i], c2Controls.at(-1)!);
      c2Ratios.push(c2StartDist / (c2StartDist + c2EndDist));
    }

    controls.push(c1);
    for (let i = 1; i < p1.getControlPointCount() - 1; i++) {
      const toO1: Vec3 = p1Controls[i];
      const toO2: Vec3 = p2Controls[i];

      const toY1: Vec3 = vec3.sub(toO2, toO1);
      const toY2: Vec3 = toY1;

      const x1Prev: Vec3 = vec3.normalize(vec3.sub(p1Controls[i], p1Controls[i - 1]));
      const x2Prev: Vec3 = vec3.normalize(vec3.sub(p2Controls[i], p2Controls[i - 1]));
      const x1Next: Vec3 = vec3.normalize(vec3.sub(p1Controls[i + 1], p1Controls[i]));
      const x2Next: Vec3 = vec3.normalize(vec3.sub(p2Controls[i + 1], p2Controls[i]));
      const toX1: Vec3 = vec3.normalize(vec3.add(x1Prev, x1Next));
      const toX2: Vec3 = vec3.normalize(vec3.add(x2Prev, x2Next));

      var toZ1: Vec3 = vec3.cross(toX1, toY1);
      var toZ2: Vec3 = vec3.cross(toX2, toY2);

      if (this.preserveHeight) {
        toZ1 = vec3.normalize(toZ1);
        toZ1 = vec3.scale(toZ1, lerp(
          vec3.length(fromZ1Start),
          vec3.length(fromZ1End),
          i / (p1.getControlPointCount() - 1))
        );

        toZ2 = vec3.normalize(toZ2);
        toZ2 = vec3.scale(toZ2, lerp(
          vec3.length(fromZ2Start),
          vec3.length(fromZ2End),
          i / (p1.getControlPointCount() - 1)
        ));
      }

      const cob1Start: Mat4 = changeOfBasis(fromX1Start, fromY1Start, fromZ1Start, fromO1Start, toX1, toY1, toZ1, toO1);
      const cob2Start: Mat4 = changeOfBasis(fromX2Start, fromY2Start, fromZ2Start, fromO2Start, toX2, toY2, toZ2, toO2);

      const cob1End: Mat4 = changeOfBasis(fromX1End, fromY1End, fromZ1End, fromO1End, toX1, toY1, toZ1, toO1);
      const cob2End: Mat4 = changeOfBasis(fromX2End, fromY2End, fromZ2End, fromO2End, toX2, toY2, toZ2, toO2);

      const controlRow: Vec4[] = [];
      for (let j = 0; j < c1.getControlPointCount(); j++) {
        const c1p1: Vec3 = vec3.transformMat4(c1Controls[j], cob1Start);
        const c1p2: Vec3 = vec3.transformMat4(c1Controls[j], cob2Start);
        const c1Combined: Vec3 = vec3.lerp(c1p1, c1p2, c1Ratios[j]);

        const c2p1: Vec3 = vec3.transformMat4(c2Controls[j], cob1End);
        const c2p2: Vec3 = vec3.transformMat4(c2Controls[j], cob2End);
        const c2Combined: Vec3 = vec3.lerp(c2p1, c2p2, c2Ratios[j]);


        const combined: Vec3 = vec3.lerp(c1Combined, c2Combined,
          i / (p1.getControlPointCount() - 1)
        );
        const combinedWeight: number = lerp(
          c1.getWeightedControlPoints()[j][3],
          c2.getWeightedControlPoints()[j][3],
          i / (p1.getControlPointCount() - 1)
        );
        controlRow.push(vec4.create(
          combined[0] * combinedWeight,
          combined[1] * combinedWeight,
          combined[2] * combinedWeight,
          combinedWeight
        ));

      }
      controls.push(new Curve(null, controlRow, c1.getDegree(), c1.getKnots()));
    }
    controls.push(c2);

    // loft
    this.surface = loft(controls, p1.getDegree());
    this.surface.showControls(true);


    // clean up
    p1.delete();
    p2.delete();
    for (const curve of controls) {
      curve.delete();
    }

  }

  private done(): void {
    this.finished = true;
    this.clicker.destroy();
    this.pipe1?.unSelect();
    this.pipe2?.unSelect();
    this.crossSection1?.unSelect();
    this.crossSection2?.unSelect();
    if (this.surface) {
      INSTANCE.getScene().addGeometry(this.surface);
    }
  }

}
