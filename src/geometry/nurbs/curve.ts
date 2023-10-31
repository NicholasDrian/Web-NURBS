import { Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { MaterialName } from "../../materials/material";
import { bin } from "../../utils/math";
import { BoundingBox } from "../boundingBox";
import { Geometry } from "../geometry";
import { Points } from "../points";
import { PolyLine } from "../polyLine";
import { Ray } from "../ray";
import { basisFuncs, genericKnotVector, span } from "./utils";

export class Curve extends Geometry {
  public static readonly SAMPLES_PER_EDGE = 20;

  private controlCage: PolyLine | null;
  private polyline: PolyLine | null;
  private controlPoints: Points | null;


  constructor(
    parent: Geometry | null,
    private weightedControlPoints: Vec4[],
    private degree: number,
    private knots: number[] = [],
    weights: number[] = [],
    model?: Mat4,
    material: MaterialName | null = null
  ) {
    super(parent, model, material);


    if (this.knots.length == 0) {
      this.knots = genericKnotVector(this.weightedControlPoints.length, this.degree);
    }
    this.controlPoints = null;
    this.controlCage = null;
    this.polyline = null;
    this.updateSamples();
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
    this.controlPoints!.delete();
    this.polyline!.delete();
    this.controlPoints!.delete();
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

  private updateSamples(): void {
    if (this.controlCage) this.controlCage.delete();
    if (this.polyline) this.polyline.delete();
    if (this.controlPoints) this.controlPoints.delete();

    const samples: Vec3[] = [];
    const sampleCount: number = Curve.SAMPLES_PER_EDGE * (this.weightedControlPoints.length - 1);
    for (let i = 0; i <= sampleCount; i++) {
      samples.push(this.sample(i / sampleCount));
    }

    const controlPointArray: Vec3[] = this.weightedControlPoints.map((point: Vec4) => {
      return vec3.create(point[0] / point[3], point[1] / point[3], point[2] / point[3]);
    })

    this.polyline = new PolyLine(this, samples,);
    this.controlCage = new PolyLine(this, controlPointArray);
    this.controlPoints = new Points(this, controlPointArray);

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
      else alpha = (knot - this.knots[i]) / this.knots[i + this.degree] - this.knots[i];
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

    /*
    int idx = NURBSUtils::Span(m_Knots, knot, m_Degree);
  std::vector<glm::vec4> newPoints;

  newPoints.push_back(m_Points[0]);
  for (int i = 1; i < m_Points.size(); i++) {
    float alpha;
    if (i <= idx - m_Degree) alpha = 1.0f;
    else if (i >= idx + 1) alpha = 0.0f;
    else alpha = (knot - m_Knots[i]) / (m_Knots[i + m_Degree] - m_Knots[i]);
    newPoints.push_back(alpha * m_Points[i] + (1.0f - alpha) * m_Points[i - 1]);
  }
  newPoints.push_back(m_Points.back());

  m_Points = newPoints;
  m_Knots.insert(std::upper_bound(m_Knots.begin(), m_Knots.end(), knot), knot);

  std::vector<glm::vec3> controlPoints;
  for (const auto& p : m_Points) controlPoints.push_back(glm::vec3(p.x, p.y, p.z) / p.w);
  m_ControlPolyLine = std::make_unique<PolyLine>(controlPoints, true, m_ID);
  m_ControlPolyLine->PointsOn();
  m_ControlPolyLine->SetModel(m_Model);
  */
  }

  public elevateDegree(n: number): void {
    /*
    std::vector<std::vector<float>> BezierAlphas(m_Degree + n + 1, std::vector(m_Degree + 1, 0.0f));
    std::vector<glm::vec4> BezControls(m_Degree + 1), ElvevatedBezControls(m_Degree + n + 1), NextBezControls(m_Degree - 1);
    std::vector<float> Alphas(m_Degree - 1);
    auto Bin = [](int a, int b) -> int {
      int res = 1;
      for (int i = a; i > a - b; i--) res *= i;
      for (int i = 2; i <= b; i++) res /= i;
      return res;
    };
    int DistinctKnots = 1;
    for (int i = 1; i < m_Knots.size(); i++)
      if (m_Knots[i] != m_Knots[i - 1]) DistinctKnots++;
    std::vector<glm::vec4> NewPoints(m_Points.size() + n * (DistinctKnots - 1));
    std::vector<float> NewKnots(m_Knots.size() + n * DistinctKnots);
    int NewDegree = m_Degree + n;
  */
    /*
      BezierAlphas[0][0] = BezierAlphas[NewDegree][m_Degree] = 1.0f;
      for (int i = 1; i <= NewDegree / 2; i++) {
        float inv = 1.0f / Bin(NewDegree, i);
        float mpi = (float)std::min((int)m_Degree, i);
        for (int j = std::max(0, i - (int)n); j <= mpi; j++) 
          BezierAlphas[i][j] = inv * Bin(m_Degree, j) * Bin(n, i - j);
    
      }
      for (int i = NewDegree / 2 + 1; i <= NewDegree - 1; i++) {
        float mpi = (float)std::min((int)m_Degree, i);
        for (int j = std::max(0, i - (int)n); j <= mpi; j++)
          BezierAlphas[i][j] = BezierAlphas[NewDegree - i][m_Degree - j];
      }
      */
    // Compute Bezier Coeficients
    // could cache this
    // TODO: factor this out
    const newDegree: number = this.degree + n;
    const bezierAlphas: number[][] = [];
    for (let i = 0; i < this.degree + n + 1; i++) {
      const temp: number[] = [];
      for (let j = 0; j < this.degree + 1; j++) {
        temp.push(0);
      }
      bezierAlphas.push(temp);
    }
    bezierAlphas[0][0] = bezierAlphas[newDegree][this.degree] = 1;
    for (let i = 1; i <= newDegree / 2; i++) {
      const inv: number = 1 / bin(newDegree, i);
      const mpi: number = Math.min(this.degree, i);
      for (let j = Math.max(0, i - n); j <= mpi; j++)
        bezierAlphas[i][j] = inv * bin(this.degree, j) * bin(n, i - j);

    }
    for (let i = newDegree / 2 + 1; i <= newDegree - 1; i++) {
      const mpi: number = Math.min(this.degree, i);
      for (let j = Math.max(0, i - n); j <= mpi; j++)
        bezierAlphas[i][j] = bezierAlphas[newDegree - i][this.degree - j];
    }


    const bezierControls: Vec4[] = [];
    for (let i = 0; i < this.degree + 1; i++) bezierControls.push(vec4.create());
    const elevatedBezierControls: Vec4[] = [];
    for (let i = 0; i < this.degree + n + 1; i++) elevatedBezierControls.push(vec4.create());
    const nextBezierControls: Vec4[] = [];
    for (let i = 0; i < this.degree - 1; i++) nextBezierControls.push(vec4.create());
    const alphas: number[] = [];
    for (let i = 0; i < this.degree - 1; i++) alphas.push(0);

    let distinctKnots = 1;
    for (let i = 1; i < this.knots.length; i++) {
      if (this.knots[i] != this.knots[i - 1]) distinctKnots++;
    }

    const newControlPoints: Vec4[] = [];
    for (let i = 0; i < this.weightedControlPoints.length + n * (distinctKnots - 1); i++) newControlPoints.push(vec4.create());
    const newKnots: number[] = [];
    for (let i = 0; i < this.knots.length + n * distinctKnots; i++) newKnots.push(0);


    /*
      // Initialize First Segment
    
      int mh = NewDegree, kind = NewDegree + 1;
      int r = -1;
      int a = m_Degree, b = m_Degree + 1, cind = 1;
      float ua = m_Knots[0];
      NewPoints[0] = m_Points[0];
      for (int i = 0; i <= NewDegree; i++) NewKnots[i] = ua;
      for (int i = 0; i <= m_Degree; i++) BezControls[i] = m_Points[i];
      */

    let mh: number = newDegree;
    let kind: number = newDegree + 1;
    let r: number = -1;
    let a: number = this.degree;
    let b: number = this.degree + 1;
    let cind: number = 1;
    let ua: number = this.knots[0];
    newControlPoints[0] = this.weightedControlPoints[0];
    for (let i = 0; i <= newDegree; i++) newKnots.push(ua);
    for (let i = 0; i <= this.degree; i++) bezierControls.push(this.weightedControlPoints[0]);

    /*
    while (b < m_Knots.size() - 1) {
      int i = b;
      while (b < m_Knots.size() - 1 && m_Knots[b] == m_Knots[b + 1]) b++;
      int mul = b - i + 1;
      mh += mul + n;
      float ub = m_Knots[b];
      int oldr = r;
      r = m_Degree - mul;
      int lbz = (oldr > 0) ? (oldr + 2) / 2 : 1;
      int rbz = (r > 0) ? NewDegree - (r + 1) / 2 : NewDegree;
     */

    //main loop
    while (b < this.knots.length) {
      const i: number = b;
      while (b < this.knots.length - 1 && this.knots[b] == this.knots[b + 1]) b++;
      const mul: number = b - i + 1;
      mh += mul + n;
      const ub: number = this.knots[b];
      const oldr: number = r;
      r = this.degree - mul;
      const lbz: number = (oldr > 0) ? (oldr + 2) / 2 : 1;
      const rbz: number = (r > 0) ? newDegree - (r + 1) / 2 : newDegree;
      // insert knots  
      /*
      if (r > 0) { 
        float number = ub - ua;
        for (int k = m_Degree; k > mul; k--) Alphas[k - mul - 1] = number / (m_Knots[a + k] - ua);
        for (int j = 1; j <= r; j++) {
          int save = r - j;
          int s = mul + j;
          for (int k = m_Degree; k >= s; k--) {
            BezControls[k] = Alphas[k - s] * BezControls[k] + (1.0f - Alphas[k - s]) * BezControls[k - 1];
          }
          NextBezControls[save] = BezControls[m_Degree];
        }
      }*/
      if (r > 0) {
        const num: number = ub - ua;
        for (let k = this.degree; k > mul; k--) alphas[k - mul - 1] = num / (this.knots[a + k] - ua);
        for (let j = 1; j <= r; j++) {
          const save: number = r - j;
          const s: number = mul + j;
          for (let k = this.degree; k > mul; k--) {
            bezierControls[k] = vec4.add(
              vec4.scale(bezierControls[k], alphas[k - s]),
              vec4.scale(bezierControls[k - 1], 1 - alphas[k - s])
            );
          }
          nextBezierControls[save] = bezierControls[this.degree];
        }
      }
      // Elevate Bezier 
      /*
      for (int i = lbz; i <= NewDegree; i++) {
        ElvevatedBezControls[i] = { 0.0f, 0.0f, 0.0f, 0.0f };
        for (int j = std::max(0, i - (int)n); j <= std::min((int)m_Degree, i); j++) {
          ElvevatedBezControls[i] += BezierAlphas[i][j] * BezControls[j];
        }
      }
       */
      for (let i = lbz; i <= newDegree; i++) {
        elevatedBezierControls[i] = vec4.create(0, 0, 0, 0);
        for (let j = Math.max(0, i - n); j <= Math.min(this.degree, i); j++) {
          elevatedBezierControls[i] = vec4.add(elevatedBezierControls[i],
            vec4.scale(bezierControls[j], bezierAlphas[i][j]));
        }
      }
      /*
          if (oldr > 1) {
            int first = kind - 2;
            int last = kind;
            float den = ub - ua;
            float bet = (ub - NewKnots[kind - 1]) / den;
            for (int tr = 1; tr < oldr; tr++) {
              int i = first, j = last, kj = j - kind + 1;
              while (j - i > tr) {
                if (i < cind) {
                  float alf = (ub - NewKnots[i]) / (ua - NewKnots[i]);
                  NewPoints[i] = alf * NewPoints[i] + (1.0f - alf) * NewPoints[i - 1];
                }
                if (j >= lbz) {
                  if (j - tr <= kind - NewDegree - oldr) {
                    float gam = (ub - NewKnots[j - tr]) / den;
                    ElvevatedBezControls[kj] = gam * ElvevatedBezControls[kj] +
                      (1.0f - gam) * ElvevatedBezControls[kj + 1];
                  }
                  else
                  {
                    ElvevatedBezControls[kj] = bet * ElvevatedBezControls[kj] +
                      (1.0f - bet) * ElvevatedBezControls[kj + 1];
                  }
                }
                i++;
                j--;
                kj--;
              }
              first--;
              last++;
            }
          }
          */
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
            i++;
            j--;
            kj--;
          }
          first--;
          last++;
        }
      }
      /*
      if (a != m_Degree) { for (int i = 0; i < NewDegree - oldr; i++) {
          NewKnots[kind++] = ua;
        }
      }
      for (int j = lbz; j <= rbz; j++) {
        NewPoints[cind++] = ElvevatedBezControls[j];
      }
      if (b < m_Knots.size() - 1) {
        for (int j = 0; j < r; j++) BezControls[j] = NextBezControls[j];
        for (int j = r; j <= m_Degree; j++) BezControls[j] = m_Points[b - m_Degree + j];
        a = b++;
        ua = ub;
      }
      else {
        for (i = 0; i <= NewDegree; i++) {
          NewKnots[kind + i] = ub;
        }
      }
      */
      if (a != this.degree) {
        for (let i = 0; i < this.degree - oldr; i++) {
          newKnots[kind++] = ua;
        }
      }
      for (let j = lbz; j <= rbz; j++) {
        newControlPoints[cind++] = elevatedBezierControls[j];
      }
      if (b < this.knots.length - 1) {
        for (let j = 0; j < r; j++) bezierControls[j] = nextBezierControls[j];
        for (let j = r; j < this.degree; j++) bezierControls[j] = this.weightedControlPoints[b - this.degree + j];
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


  /*
      if (a != m_Degree) { for (int i = 0; i < NewDegree - oldr; i++) {
          NewKnots[kind++] = ua;
        }
      }
      for (int j = lbz; j <= rbz; j++) {
        NewPoints[cind++] = ElvevatedBezControls[j];
      }
      if (b < m_Knots.size() - 1) {
        for (int j = 0; j < r; j++) BezControls[j] = NextBezControls[j];
        for (int j = r; j <= m_Degree; j++) BezControls[j] = m_Points[b - m_Degree + j];
        a = b++;
        ua = ub;
      }
      else {
        for (i = 0; i <= NewDegree; i++) {
          NewKnots[kind + i] = ub;
        }
      }
    }
  
    m_Points = NewPoints;
    m_Knots = NewKnots;
    m_Degree = NewDegree;
  	
    UpdateSamples();
    UpdateVertexArray();
  
    std::vector<glm::vec3> controlPoints;
    for (const auto& p : m_Points) controlPoints.push_back(glm::vec3(p.x, p.y, p.z) / p.w);
    m_ControlPolyLine = std::make_unique<PolyLine>(controlPoints, true, m_ID);
    m_ControlPolyLine->PointsOn();
    m_ControlPolyLine->SetModel(m_Model);
  
    DebugPrint();
  }
     */


}
