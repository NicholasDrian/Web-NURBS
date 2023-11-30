import { Mat4, Vec3, vec3, vec4, Vec4 } from "wgpu-matrix";
import { Curve } from "./curve";
import { Surface } from "./surface";
import { genericKnotVector, matchDegrees, matchKnots } from "./utils";




export const loft = function(curves: Curve[], degree: number): Surface {

  const duplicates: Curve[] = [];
  for (const c of curves) duplicates.push(<Curve>c.clone());

  const degreeU: number = Math.min(degree, duplicates.length - 1);
  matchDegrees(duplicates);
  matchKnots(duplicates);
  let degreeV: number = duplicates[0].getDegree();

  const points: Vec4[][] = [];
  for (let i = 0; i < duplicates.length; i++) {
    const curve: Curve = duplicates[i];
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

  const knotsU: number[] = genericKnotVector(duplicates.length, degreeU);

  const res: Surface = new Surface(points, knotsU, duplicates[0].getKnots(), degreeU, degreeV);

  for (const c of duplicates) c.delete();

  return res;
}
