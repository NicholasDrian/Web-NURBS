import { Mat4, Vec3, vec3, vec4, Vec4 } from "wgpu-matrix";
import { Curve } from "./curve";
import { Surface } from "./surface";
import { genericKnotVector } from "./utils";



const equals = function(a: number, b: number, e: number = 0.000001): boolean { return Math.abs(a - b) < e; };

/*
    // match degrees
    int degreeU = std::min(degree, (int)curves.size() - 1);
    int degreeV = 0;
    for (const auto& c : curves) degreeV = std::max(degreeV, (int)c->GetDegree());
    for (auto& c : curves) if (c->GetDegree() < degreeV) c->ElevateDegree(degreeV - c->GetDegree());
    
    // match knots
    auto equals = [](float a, float b) { return abs(a - b) < 0.000001f; };
    for (auto& c : curves) c->NormalizeKnots();
    for (int i = 0; i < curves[0]->GetKnotCount(); i++) {
        float smallest = std::numeric_limits<float>::infinity();
        bool finished = true;
        for (const auto& c : curves) {
            if (i < c->GetKnotCount()) {
                finished = false;
                smallest = std::min(smallest, c->GetKnot(i));
            }
        }
        if (finished) break;
        for (auto& c : curves) {
            if (!equals(c->GetKnot(i), smallest)) c->InsertKnot(smallest);
        }
    }
 
*/
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
      const model: Mat4 = curve.getModel();
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
  console.log(points);

  return new Surface(points, knotsU, curves[0].getKnots(), degreeU, degreeV);



  /*
      // loft
      std::vector<std::vector<glm::vec4>> points(curves.size());
      for (int i = 0; i < curves.size(); i++) {
          NURBS* curve = curves[i];
          for (int j = 0; j < curve->GetNumControlPoints(); j++) {
              points[i].push_back(curve->GetModel() * curve->GetControlPoints()[j]);
          }
      }
      std::vector<float> knotsU = NURBSUtils::GenericKnotVector((int)curves.size(), degreeU);
  
      return NURBSurface(points, knotsU, curves[0]->GetKnots(), degreeU, degreeV);
  
  */
}
