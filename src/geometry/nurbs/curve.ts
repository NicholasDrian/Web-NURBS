import { vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { BoundingBox } from "../boundingBox";
import { Geometry } from "../geometry";
import { PolyLine } from "../polyLine";
import { basisFuncs, genericKnotVector, span } from "./utils";



export class Curve extends Geometry {

  public static readonly SAMPLES_PER_EDGE = 10;

  private controlCage: PolyLine | null;
  private polyline: PolyLine | null;

  constructor(
    private controlPoints: Vec4[],
    private degree: number,
    private knots: number[] = [],
  ) {
    super();
    if (this.knots.length == 0) {
      this.knots = genericKnotVector(this.controlPoints.length, this.degree);
    }
    this.controlCage = null;
    this.polyline = null;
    this.updateSamples();
  }

  public getBoundingBox(): BoundingBox {
    return this.controlCage!.getBoundingBox();
  }

  public getDegree(): number {
    return this.degree;
  }

  public destroy(): void {
    this.controlCage?.delete();
    this.polyline?.delete();
  }

  public addControlPoint(point: Vec3, weight: number) {
    this.controlPoints.push(vec4.create(...point, weight));
    this.knots = genericKnotVector(this.controlPoints.length, this.degree);
    this.updateSamples();
  }

  public updateLastControlPoint(point: Vec3, weight: number) {
    this.controlPoints[this.controlPoints.length - 1] = vec4.create(...point, weight);
    this.updateSamples();
  }

  public removeLastControlPoint(): void {
    this.controlPoints.pop();
    if (this.degree === this.controlPoints.length) this.degree--;
    this.knots = genericKnotVector(this.controlPoints.length, this.degree);
    this.updateSamples();
  }

  public elevateDegree(count: number) {
    this.degree += count;
    this.knots = genericKnotVector(this.controlPoints.length, this.degree);
    this.updateSamples();
  }

  public getControlPointCount(): number {
    return this.controlPoints.length;
  }

  protected updateSamples(): void {
    if (this.controlCage) this.controlCage.delete();
    if (this.polyline) this.polyline.delete();

    const samples: Vec4[] = [];
    const sampleCount: number = Curve.SAMPLES_PER_EDGE * (this.controlPoints.length - 1);
    for (let i = 0; i <= sampleCount; i++) {
      samples.push(this.sample(i / sampleCount));
    }

    this.polyline = new PolyLine(samples.map((point: Vec4) => { return vec3.create(point[0] / point[3], point[1] / point[3], point[2] / point[3]); }), [0, 1, 0, 1]);
    this.controlCage = new PolyLine(this.controlPoints.map((point: Vec4) => { return vec3.create(point[0], point[1], point[2]); }), [0, 0, 1, 1]);
  }

  protected sample(t: number): Vec4 {
    const u: number = t * (this.knots.at(-1)! - this.knots.at(0)!);
    const knotSpan: number = span(this.knots, u, this.degree)
    const funcs: number[] = basisFuncs(this.knots, u, this.degree);
    let res: Vec4 = vec4.create(0, 0, 0, 0);
    for (let i = 0; i <= this.degree; i++) {
      res = vec4.add(res, vec4.scale(this.controlPoints[knotSpan - this.degree + i], funcs[i]));
    }
    return res;
  }
}
