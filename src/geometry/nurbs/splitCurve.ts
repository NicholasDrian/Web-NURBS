import { Vec4 } from "wgpu-matrix";
import { Curve } from "./curve";

export const splitCurve = function(curve: Curve, u: number): [Curve, Curve] {

  const temp: Curve = <Curve>curve.clone();

  const knots: number[] = temp.getKnots();

  let count: number = 0;
  for (let knot of knots) { if (knot === u) count++; }

  for (let i = 0; i < temp.getDegree() - count; i++) {
    temp.insertKnot(u);
  }


  let first: number = 0;
  while (knots[first] != u) first++;


  const knots1: number[] = knots.slice(0, first + curve.getDegree());
  knots1.push(u);

  const knots2: number[] = [u, ...knots.slice(first, knots.length)];
  for (let i = 1; i < knots2.length; i++) {
    knots2[i] -= knots2[0];
  }


  const points: Vec4[] = temp.getWeightedControlPoints();
  const points1: Vec4[] = points.slice(0, knots1.length - curve.getDegree() - 1);
  const points2: Vec4[] = points.slice(points1.length - 1, points.length);


  temp.delete();

  return [
    new Curve(curve.getParent(), points1, curve.getDegree(), knots1, curve.getModel(), curve.getMaterial()),
    new Curve(curve.getParent(), points2, curve.getDegree(), knots2, curve.getModel(), curve.getMaterial()),
  ];


}
