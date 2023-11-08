import { Mat4, Vec3, vec3, vec4, Vec4 } from "wgpu-matrix";
import { Curve } from "./curve";
import { Surface } from "./surface";
import { genericKnotVector } from "./utils";



const equals = function(a: number, b: number, e: number = 0.000001): boolean { return Math.abs(a - b) < e; };

export const loft = function(curves: Curve[], degree: number): Surface {
  // match degrees
  const degreeU: number = Math.min(degree, curves.length - 1);
  let degreeV: number = 0;
  for (let curve of curves) degreeV = Math.max(degreeV, curve.getDegree());
  for (let curve of curves) if (curve.getDegree() < degreeV) curve.elevateDegree(degreeV - curve.getDegree());

  // match knots
  for (let curve of curves) curve.normalizeKnots();
  for (let i = 0; i < curves[0].getKnotCount(); i++) {
    var smallest: number = Number.POSITIVE_INFINITY;
    var finished: boolean = true;
    for (let curve of curves) {
      if (i < curve.getKnotCount()) {
        finished = false;
        smallest = Math.min(smallest, curve.getKnots()[i]);
      }
    }
    if (finished) break;
    for (let curve of curves) {
      if (!equals(curve.getKnots()[i], smallest)) curve.insertKnot(smallest);
    }
  }

  //loft
  const points: Vec4[][] = [];
  for (let i = 0; i < curves.length; i++) {
    const curve: Curve = curves[i];
    const curveControls: Vec4[] = curve.getWeightedControlPoints();
    points.push([]);
    for (let j = 0; j < curveControls.length; j++) {
      const model: Mat4 = curve.getModelRecursive();
      const weight: number = curveControls[j][3];
      var point: Vec3 = vec3.create(
        curveControls[j][0] / weight,
        curveControls[j][1] / weight,
        curveControls[j][2] / weight,
      );
      point = vec3.transformMat4(point, model);
      points[i].push(vec4.create(
        point[0] * weight,
        point[1] * weight,
        point[2] * weight,
        weight
      ));
    }
  }

  const knotsU: number[] = genericKnotVector(curves.length, degreeU);

  return new Surface(points, knotsU, curves[0].getKnots(), degreeU, degreeV);
}
