import { vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { PolyLine } from "../polyLine";
import { basisFuncs, span } from "./utils";



export class Curve {

  public static readonly SAMPLES_PER_EDGE = 10;

  private controlCage: PolyLine;
  private polyline!: PolyLine;


  constructor(
    private points: Vec4[],
    private knots: number[],
    private degree: number
  ) {
    this.controlCage = new PolyLine(points, [0, 0, 1, 1]);
    this.updateSamples();
  }


  protected updateSamples(): void {
    const samples: Vec3[] = [];
    const sampleCount: number = Curve.SAMPLES_PER_EDGE * (this.points.length - 1);
    for (let i = 0; i <= sampleCount; i++) {
      samples.push(this.sample(i / sampleCount));
    }
    this.polyline = new PolyLine(samples, [0, 1, 0, 1]);

  }

  protected sample(t: number): Vec3 {
    const u: number = t * (this.knots.at(-1)! - this.knots.at(0)!);
    const knotSpan: number = span(this.knots, u, this.degree)
    const funcs: number[] = basisFuncs(this.knots, u, this.degree);
    let res: Vec4 = vec4.create(0, 0, 0, 0);
    for (let i = 0; i <= this.degree; i++) {
      res = vec4.add(res, vec4.scale(this.points[knotSpan - this.degree + i], funcs[i]));
    }
    return vec3.create(res[0] / res[3], res[1] / res[3], res[2] / res[3]);
  }



}
