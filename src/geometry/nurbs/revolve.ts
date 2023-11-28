import { Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { Ray } from "../ray";
import { Curve } from "./curve";
import { Surface } from "./surface";

export const revolve = function(axis: Ray, curve: Curve, theta: number): Surface {

  if (theta < 0 || theta > Math.PI * 2) throw new Error("Invalid params");

  const outKnots: number[] = [];
  var narcs: number;
  if (theta <= Math.PI / 2) {
    narcs = 1;
    outKnots.push(0, 0, 0, 1, 1, 1);
  } else if (theta <= Math.PI) {
    narcs = 2;
    outKnots.push(0, 0, 0, 0.5, 0.5, 1, 1, 1);
  } else if (theta <= 3 * Math.PI / 2) {
    narcs = 3;
    outKnots.push(0, 0, 0, 1 / 3, 1 / 3, 2 / 3, 2 / 3, 1, 1, 1);
  } else {
    narcs = 4;
    outKnots.push(0, 0, 0, 1 / 4, 1 / 4, 2 / 4, 2 / 4, 3 / 4, 3 / 4, 1, 1, 1);
  }

  const outControls: Vec3[][] = [];
  const outWeights: number[][] = [];
  for (let i = 0; i <= 2 * narcs; i++) {
    outControls.push([]);
    outWeights.push([]);
  }

  const dTheta: number = theta / narcs;
  const wm: number = Math.cos(dTheta / 2);
  const cosCash: number[] = [];
  const sinCash: number[] = [];
  for (let i = 0, angle = 0; i < narcs; i++) {
    angle += dTheta;
    cosCash.push(Math.cos(angle));
    sinCash.push(Math.sin(angle));
  }
  const model: Mat4 = curve.getModelRecursive();
  const points: Vec3[] = [];
  const weights: number[] = [];
  for (const point of curve.getWeightedControlPoints()) {
    weights.push(point[3]);
    const p: Vec3 = vec3.create(point[0] / point[3], point[1] / point[3], point[2] / point[3]);
    points.push(vec3.transformMat4(p, model));
  }

  for (let j = 0; j < points.length; j++) {

    var P0: Vec3 = points[j];
    const W0: number = weights[j];

    const O: Vec3 = axis.closestPointToPoint(P0);
    var X: Vec3 = vec3.sub(P0, O);
    const r: number = vec3.length(X);

    if (X[0] === 0 && X[1] === 0 && X[2] === 0) {
      X = vec3.create(1, 0, 0);
    } else {
      X = vec3.scale(X, 1 / r);
    }

    const Y: Vec3 = vec3.cross(axis.getDirection(), X);

    outControls[0].push(P0);
    outWeights[0].push(W0);

    var T0: Vec3 = vec3.clone(Y);
    var index: number = 0;

    for (let i = 0; i < narcs; i++) {
      const P2: Vec3 = vec3.add(O, vec3.add(vec3.scale(X, r * cosCash[i]), vec3.scale(Y, r * sinCash[i])));
      const T2: Vec3 = vec3.sub(vec3.scale(Y, cosCash[i]), vec3.scale(X, sinCash[i]));
      const ray: Ray = new Ray(P0, T0);
      outControls[index + 1].push(ray.closestPointOnLine(P2, vec3.add(P2, T2)));
      outWeights[index + 1].push(wm * weights[j]);
      outControls[index + 2].push(P2);
      outWeights[index + 2].push(weights[j]);

      index += 2;
      if (i < narcs - 1) {
        P0 = P2;
        T0 = T2;
      }
    }
  }

  const outWeightedControls: Vec4[][] = [];
  for (let i = 0; i < outControls.length; i++) {
    const temp: Vec4[] = [];
    for (let j = 0; j < outControls[0].length; j++) {
      temp.push(vec4.create(
        ...vec3.scale(outControls[i][j], outWeights[i][j]),
        outWeights[i][j]
      ));
    }
    outWeightedControls.push(temp);
  }

  return new Surface(outWeightedControls, outKnots, [...curve.getKnots()], curve.getDegree(), 2);

}
