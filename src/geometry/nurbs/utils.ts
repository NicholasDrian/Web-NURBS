import { warn } from "console";
import { Vec3, vec4, Vec4 } from "wgpu-matrix";
import { bin } from "../../utils/math";

export const span = function(knots: number[], u: number, p: number): number {
  const n: number = knots.length - p - 2;
  let l: number = p;
  let h: number = n;
  let m: number;
  while (l < h) {
    m = Math.floor((l + h) / 2);
    if (u >= knots[m + 1]) l = m + 1;
    else h = m;
  }
  return l;
}

export const basisFuncs = function(knots: number[], u: number, p: number): number[] {
  const funcs: number[] = [1];
  const i = span(knots, u, p);
  const left = (i: number, j: number) => { return u - knots[i - j + 1]; };
  const right = (i: number, j: number) => { return knots[i + j] - u; };
  for (let j = 1; j <= p; j++) {
    let saved = 0;
    for (let r = 0; r < j; r++) {
      const temp = funcs[r] / (right(i, r + 1) + left(i, j - r));
      funcs[r] = saved + right(i, r + 1) * temp;
      saved = left(i, j - r) * temp;
    }
    funcs.push(saved);
  }
  return funcs;
}


export const genericKnotVector = function(pointCount: number, degree: number): number[] {
  const res: number[] = [];
  for (let i = 0; i <= degree; i++) res.push(0);
  for (let i = 1; i < pointCount - degree; i++)  res.push(i);
  for (let i = 0; i <= degree; i++) res.push(pointCount - degree);
  return res;
}

export const toWeightedControlPoints = function(points: Vec3[], weights?: number[]): Vec4[] {
  const res: Vec4[] = [];

  if (weights) {
    for (let i = 0; i < weights.length; i++) {
      const point: Vec3 = points[i];
      res.push(vec4.create(
        point[0] * weights[i],
        point[1] * weights[i],
        point[2] * weights[i],
        weights[i]
      ));
    }
  } else {
    for (let point of points) {
      res.push(vec4.create(...point, 1));
    }
  }
  return res;
}

export const calcBezierAlphas = function(startDegree: number, endDegree: number): number[][] {
  const bezierAlphas: number[][] = [];
  for (let i = 0; i < endDegree + 1; i++) {
    const temp: number[] = [];
    for (let j = 0; j < startDegree + 1; j++) {
      temp.push(0);
    }
    bezierAlphas.push(temp);
  }
  bezierAlphas[0][0] = bezierAlphas[endDegree][startDegree] = 1;
  for (let i = 1; i <= Math.floor(endDegree / 2); i++) {
    const inv: number = 1 / bin(endDegree, i);
    const mpi: number = Math.min(startDegree, i);
    for (let j = Math.max(0, i - endDegree + startDegree); j <= mpi; j++)
      bezierAlphas[i][j] = inv * bin(startDegree, j) * bin(endDegree - startDegree, i - j);

  }
  for (let i = Math.floor(endDegree / 2) + 1; i <= endDegree - 1; i++) {
    const mpi: number = Math.min(startDegree, i);
    for (let j = Math.max(0, i - endDegree + startDegree); j <= mpi; j++)
      bezierAlphas[i][j] = bezierAlphas[endDegree - i][startDegree - j];
  }
  return bezierAlphas;
}
