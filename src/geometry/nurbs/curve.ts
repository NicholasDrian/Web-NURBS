import { mat4, Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { MaterialName } from "../../materials/material";
import { cloneVec4List } from "../../utils/clone";
import { BoundingBox } from "../boundingBox";
import { ControlCage1D } from "../controlCage1D";
import { Frustum } from "../frustum";
import { Geometry } from "../geometry";
import { Intersection } from "../intersection";
import { Points } from "../points";
import { PolyLine } from "../polyLine";
import { Ray } from "../ray";
import { basisFuncs, calcBezierAlphas, genericKnotVector, span } from "./utils";

export class Curve extends Geometry {
  public static readonly SAMPLES_PER_EDGE = 20;

  private controlCage: ControlCage1D | null;
  private polyline: PolyLine | null;

  constructor(
    parent: Geometry | null,
    private weightedControlPoints: Vec4[],
    private degree: number,
    private knots: number[] = [],
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);

    if (this.knots.length == 0) {
      this.knots = genericKnotVector(this.weightedControlPoints.length, this.degree);
    }
    this.controlCage = null;
    this.polyline = null;
    this.updateSamples();
  }

  public addToSubSelection(subID: number): void {
    throw new Error("shouldnt need this");
  }
  public removeFromSubSelection(subID: number): void {
    throw new Error("shouldnt need this");
  }
  public isSubSelected(subID: number): boolean {
    throw new Error("shouldnt need this");
  }
  public clearSubSelection(): void {
    this.controlCage!.clearSubSelection();
  }
  public getSubSelectionBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public onSelectionMoved(): void {
    if (this.controlCage!.hasSubSelection()) {
      const newVerts: Vec3[] = this.controlCage!.getVertsSubSelectionTransformed();
      this.weightedControlPoints = this.weightedControlPoints.map((p: Vec4, index: number) => {
        const newVert: Vec3 = newVerts[index];
        return vec4.create(newVert[0] * p[3], newVert[1] * p[3], newVert[2] * p[3], p[3]);
      });
      this.updateSamples(false);
    }
  }

  public bakeSelectionTransform(): void {
    this.controlCage!.bakeSelectionTransform();
  }

  public clone(): Geometry {
    return new Curve(this.parent,
      cloneVec4List(this.weightedControlPoints),
      this.degree,
      [...this.knots],
      mat4.clone(this.model),
      this.materialName);
  }

  public delete(): void {
    this.controlCage!.delete();
    this.polyline!.delete();
    INSTANCE.getScene().removeGeometry(this);
  }

  public getKnots(): number[] {
    return this.knots;
  }

  public getWeightedControlPoints(): Vec4[] {
    return this.weightedControlPoints;
  }

  public getKnotCount(): number {
    return this.knots.length;
  }

  public intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    return this.controlCage!.intersect(ray) ||
      this.polyline!.intersect(ray);
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
    this.weightedControlPoints.push(vec4.create(...point, weight));
    this.knots = genericKnotVector(this.weightedControlPoints.length, this.degree);
    this.updateSamples();
  }

  public updateLastControlPoint(point: Vec3, weight: number) {
    this.weightedControlPoints[this.weightedControlPoints.length - 1] = vec4.create(...point, weight);
    this.updateSamples();
  }

  public removeLastControlPoint(): void {
    this.weightedControlPoints.pop();
    if (this.degree === this.weightedControlPoints.length) this.degree--;
    this.knots = genericKnotVector(this.weightedControlPoints.length, this.degree);
    this.updateSamples();
  }

  public changeDegree(degree: number) {
    while (degree >= this.weightedControlPoints.length) degree--;
    this.degree = degree;
    this.knots = genericKnotVector(this.weightedControlPoints.length, this.degree);
    this.updateSamples();
  }


  public getControlPointCount(): number {
    return this.weightedControlPoints.length;
  }

  private updateSamples(updateCage: boolean = true): void {



    if (updateCage && this.controlCage) this.controlCage.delete();
    if (this.polyline) this.polyline.delete();

    const samples: Vec3[] = [];
    const sampleCount: number = Curve.SAMPLES_PER_EDGE * (this.weightedControlPoints.length - 1);
    for (let i = 0; i <= sampleCount; i++) {
      samples.push(this.sample(i / sampleCount));
    }

    const controlPointArray: Vec3[] = this.weightedControlPoints.map((point: Vec4) => {
      return vec3.create(point[0] / point[3], point[1] / point[3], point[2] / point[3]);
    })

    this.polyline = new PolyLine(this, samples,);
    if (updateCage) this.controlCage = new ControlCage1D(this, controlPointArray);

  }

  private sample(t: number): Vec3 {
    const u: number = t * (this.knots.at(-1)! - this.knots.at(0)!);
    const knotSpan: number = span(this.knots, u, this.degree)
    const funcs: number[] = basisFuncs(this.knots, u, this.degree);
    let res: Vec4 = vec4.create(0, 0, 0, 0);
    for (let i = 0; i <= this.degree; i++) {
      res = vec4.add(res, vec4.scale(this.weightedControlPoints[knotSpan - this.degree + i], funcs[i]));
    }
    return vec3.create(res[0] / res[3], res[1] / res[3], res[2] / res[3]);
  }

  public normalizeKnots(): void {
    const start: number = this.knots[0];
    const end: number = this.knots[this.knots.length - 1];
    const dist = end - start;
    for (let i = 0; i < this.knots.length; i++) {
      this.knots[i] = (this.knots[i] - start) / dist;
    }
  }

  public insertKnot(knot: number): void {
    const idx: number = span(this.knots, knot, this.degree);
    const newWeightedControlPoints: Vec4[] = [];
    newWeightedControlPoints.push(this.weightedControlPoints[0]);
    for (let i = 1; i < this.weightedControlPoints.length; i++) {
      let alpha: number;
      if (i <= idx - this.degree) alpha = 1;
      else if (i >= idx + 1) alpha = 0;
      else alpha = (knot - this.knots[i]) / (this.knots[i + this.degree] - this.knots[i]);
      newWeightedControlPoints.push(vec4.add(
        vec4.scale(this.weightedControlPoints[i], alpha),
        vec4.scale(this.weightedControlPoints[i - 1], 1 - alpha)
      ));
    }
    newWeightedControlPoints.push(this.weightedControlPoints[this.weightedControlPoints.length - 1]);
    this.weightedControlPoints = newWeightedControlPoints;

    this.knots.push(knot);
    this.knots.sort();

    this.updateSamples();

  }

  public override getTypeName(): string {
    return "Curve";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    return this.polyline!.isWithinFrustum(frustum, inclusive);
  }

  public elevateDegree(n: number): void {
    // TODO: clean up
    const newDegree: number = this.degree + n;
    const bezierAlphas = calcBezierAlphas(this.degree, newDegree);
    const bezierControls: Vec4[] = [];
    for (let i = 0; i < this.degree + 1; i++) bezierControls.push(vec4.create());
    const elevatedBezierControls: Vec4[] = [];
    for (let i = 0; i < this.degree + n + 1; i++) elevatedBezierControls.push(vec4.create());
    const nextBezierControls: Vec4[] = [];
    const alphas: number[] = [];
    for (let i = 0; i < this.degree - 1; i++) {
      nextBezierControls.push(vec4.create());
      alphas.push(0);
    }

    let distinctKnots = 1;
    for (let i = 1; i < this.knots.length; i++) {
      if (this.knots[i] != this.knots[i - 1]) distinctKnots++;
    }

    const newControlPoints: Vec4[] = [];
    for (let i = 0; i < this.weightedControlPoints.length + n * (distinctKnots - 1); i++) {
      newControlPoints.push(vec4.create());
    }
    const newKnots: number[] = [];
    for (let i = 0; i < this.knots.length + n * distinctKnots; i++) newKnots.push(0);


    // Initialize First Segment
    let mh: number = newDegree;
    let kind: number = newDegree + 1;
    let r: number = -1;
    let a: number = this.degree;
    let b: number = this.degree + 1;
    let cind: number = 1;
    let ua: number = this.knots[0];
    newControlPoints[0] = this.weightedControlPoints[0];
    for (let i = 0; i <= newDegree; i++) newKnots[i] = ua;
    for (let i = 0; i <= this.degree; i++) bezierControls[i] = this.weightedControlPoints[i];

    //main loop
    while (b < this.knots.length - 1) {
      const IDK: number = b;
      while (b < this.knots.length - 1 && this.knots[b] == this.knots[b + 1]) b++;
      const mul: number = b - IDK + 1;
      mh += mul + n;
      const ub: number = this.knots[b];
      const oldr: number = r;
      r = this.degree - mul;
      const lbz: number = (oldr > 0) ? Math.floor((oldr + 2) / 2) : 1;
      const rbz: number = (r > 0) ? newDegree - Math.floor((r + 1) / 2) : newDegree;
      // insert knots  
      if (r > 0) {
        const num: number = ub - ua;
        for (let k = this.degree; k > mul; k--) alphas[k - mul - 1] = num / (this.knots[a + k] - ua);
        for (let j = 1; j <= r; j++) {
          const save: number = r - j;
          const s: number = mul + j;
          for (let k = this.degree; k >= s; k--) {
            bezierControls[k] = vec4.add(
              vec4.scale(bezierControls[k], alphas[k - s]),
              vec4.scale(bezierControls[k - 1], 1 - alphas[k - s])
            );
          }
          nextBezierControls[save] = bezierControls[this.degree];
        }
      }
      // Elevate Bezier 
      for (let i = lbz; i <= newDegree; i++) {
        elevatedBezierControls[i] = vec4.create(0, 0, 0, 0);
        for (let j = Math.max(0, i - n); j <= Math.min(this.degree, i); j++) {
          elevatedBezierControls[i] = vec4.add(elevatedBezierControls[i],
            vec4.scale(bezierControls[j], bezierAlphas[i][j]));
        }
      }
      //  Remove knots
      if (oldr > 1) {
        var first: number = kind - 2;
        var last: number = kind;
        const den: number = ub - ua;
        const bet: number = (ub - newKnots[kind - 1]) / den;
        for (let tr = 1; tr < oldr; tr++) {
          let i: number = first;
          let j: number = last;
          let kj: number = j - kind + 1;
          while (j - i > tr) {
            if (i < cind) {
              const alf = (ub - newKnots[i]) / (ua - newKnots[i]);
              newControlPoints[i] = vec4.add(
                vec4.scale(newControlPoints[i], alf),
                vec4.scale(newControlPoints[i - 1], 1 - alf)
              );
            }
            if (j >= lbz) {
              if (j - tr <= kind - newDegree - oldr) {
                const gam: number = (ub - newKnots[j - tr]) / den;
                elevatedBezierControls[kj] = vec4.add(
                  vec4.scale(elevatedBezierControls[kj], gam),
                  vec4.scale(elevatedBezierControls[kj + 1], 1 - gam)
                );
              } else {
                elevatedBezierControls[kj] = vec4.add(
                  vec4.scale(elevatedBezierControls[kj], bet),
                  vec4.scale(elevatedBezierControls[kj + 1], 1 - bet)
                );
              }
            }
            i++; j--; kj--;
          }
          first--; last++;
        }
      }
      if (a != this.degree) {
        for (let i = 0; i < newDegree - oldr; i++) {
          newKnots[kind++] = ua;
        }
      }
      for (let j = lbz; j <= rbz; j++) {
        newControlPoints[cind++] = elevatedBezierControls[j];
      }
      if (b < this.knots.length - 1) {
        for (let j = 0; j < r; j++) bezierControls[j] = nextBezierControls[j];
        for (let j = r; j <= this.degree; j++) {
          bezierControls[j] = this.weightedControlPoints[b - this.degree + j];
        }
        a = b++;
        ua = ub;
      } else {
        for (let i = 0; i <= newDegree; i++) {
          newKnots[kind + i] = ub;
        }
      }

    }
    this.weightedControlPoints = newControlPoints;
    this.knots = newKnots;
    this.degree = newDegree;

    this.updateSamples();

  }

}
