import { vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { Ray } from "../ray";
import { Curve } from "./curve";


export const createArc = function(
  origin: Vec3,
  xAxis: Vec3,
  yAxis: Vec3,
  radius: number,
  thetaStart: number,
  thetaEnd: number): Curve {

  if (thetaEnd < thetaStart) thetaEnd += 360;

  const theta: number = thetaEnd - thetaStart;

  let arcCount: number;
  if (theta <= Math.PI / 2) arcCount = 1;
  else if (theta <= Math.PI) arcCount = 2;
  else if (theta <= 3 * Math.PI / 2) arcCount = 3;
  else arcCount = 4;

  const dTheta: number = theta / arcCount;

  const weight: number = Math.cos(dTheta / 2);

  var point0: Vec3 = vec3.add(origin, vec3.add(
    vec3.scale(xAxis, radius * Math.cos(thetaStart)),
    vec3.scale(yAxis, radius * Math.sin(thetaStart)),
  ));

  var tangent0: Vec3 = vec3.add(
    vec3.scale(xAxis, -Math.sin(thetaStart)),
    vec3.scale(yAxis, Math.cos(thetaStart))
  );

  const weightedControls: Vec4[] = [vec4.create(...point0, 1)];
  const knots: number[] = [];

  var angle: number = thetaStart;

  for (let i = 1; i <= arcCount; i++) {
    angle += dTheta;

    const point2: Vec3 = vec3.add(origin, vec3.add(
      vec3.scale(xAxis, radius * Math.cos(angle)),
      vec3.scale(yAxis, radius * Math.sin(angle)),
    ));

    const tangent2: Vec3 = vec3.add(
      vec3.scale(xAxis, -Math.sin(angle)),
      vec3.scale(yAxis, Math.cos(angle))
    );

    const ray0: Ray = new Ray(point0, tangent0);
    const ray1: Ray = new Ray(point2, tangent2);
    const point1: Vec3 = ray0.closestPointToLine(ray1.getOrigin(), vec3.add(ray1.getDirection(), ray1.getOrigin()));

    weightedControls.push(
      vec4.create(...vec3.scale(point1, weight), weight),
      vec4.create(...point2, 1)
    );

    if (i < arcCount) {
      point0 = point2;
      tangent0 = tangent2;
    }

  }

  knots.push(0, 0, 0);
  switch (arcCount) {
    case 1:
      break;
    case 2:
      knots.push(1 / 2, 1 / 2);
      break;
    case 3:
      knots.push(1 / 3, 1 / 3, 2 / 3, 2 / 3);
      break;
    case 4:
      knots.push(1 / 4, 1 / 4, 2 / 4, 2 / 4, 3 / 4, 3 / 4);
      break;
  }
  knots.push(1, 1, 1);

  return new Curve(null, weightedControls, 2, knots);
}
