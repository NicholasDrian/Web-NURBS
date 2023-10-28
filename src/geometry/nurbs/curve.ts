import { mat4, Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { MaterialName } from "../../materials/material";
import { BoundingBox } from "../boundingBox";
import { Geometry } from "../geometry";
import { PolyLine } from "../polyLine";
import { Ray } from "../ray";
import { basisFuncs, genericKnotVector, span } from "./utils";

export class Curve extends Geometry {
  public static readonly SAMPLES_PER_EDGE = 20;

  private controlCage: PolyLine | null;
  private polyline: PolyLine | null;
  private controlPoints: Vec4[];

  constructor(
    parent: Geometry | null,
    controlPoints: Vec3[],
    private degree: number,
    private knots: number[] = [],
    weights: number[] = [],
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);


    if (this.knots.length == 0) {
      this.knots = genericKnotVector(controlPoints.length, this.degree);
    }
    this.controlPoints = [];
    if (weights.length == 0) {
      for (let point of controlPoints) {
        this.controlPoints.push(vec4.create(...point, 1));
      }
    } else {
      for (let i = 0; i < weights.length; i++) {
        const point: Vec3 = controlPoints[i];
        this.controlPoints.push(vec4.create(
          point[0] * weights[i],
          point[1] * weights[i],
          point[2] * weights[i],
          weights[i]
        ));
      }
    }
    this.controlCage = null;
    this.polyline = null;
    this.updateSamples();
  }

  public intersect(ray: Ray): number | null {
    return this.polyline!.intersect(ray);
  }

  public getBoundingBox(): BoundingBox {
    return this.controlCage!.getBoundingBox();
  }

  public getDegree(): number {
    return this.degree;
  }

  public destroy(): void {
    this.controlCage!.delete();
    this.polyline!.delete();
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

  private updateSamples(): void {
    if (this.controlCage) this.controlCage.delete();
    if (this.polyline) this.polyline.delete();

    const samples: Vec3[] = [];
    const sampleCount: number = Curve.SAMPLES_PER_EDGE * (this.controlPoints.length - 1);
    for (let i = 0; i <= sampleCount; i++) {
      samples.push(this.sample(i / sampleCount));
    }

    this.polyline = new PolyLine(
      this,
      samples,
    );
    this.controlCage = new PolyLine(
      this,
      this.controlPoints.map((point: Vec4) => {
        return vec3.create(point[0] / point[3], point[1] / point[3], point[2] / point[3]);
      })
    );

  }

  private sample(t: number): Vec3 {
    const u: number = t * (this.knots.at(-1)! - this.knots.at(0)!);
    const knotSpan: number = span(this.knots, u, this.degree)
    const funcs: number[] = basisFuncs(this.knots, u, this.degree);
    let res: Vec4 = vec4.create(0, 0, 0, 0);
    for (let i = 0; i <= this.degree; i++) {
      res = vec4.add(res, vec4.scale(this.controlPoints[knotSpan - this.degree + i], funcs[i]));
    }
    return vec3.create(res[0] / res[3], res[1] / res[3], res[2] / res[3]);
  }
}
