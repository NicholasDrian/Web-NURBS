import { mat4, Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { MaterialName } from "../../materials/material";
import { BoundingBox } from "../boundingBox";
import { Frustum } from "../frustum";
import { Geometry } from "../geometry";
import { Intersection } from "../intersection";
import { Mesh } from "../mesh";
import { Ray } from "../ray";
import { Curve } from "./curve";
import { basisFuncs, span } from "./utils";




export class Surface extends Geometry {

  private mesh: Mesh | null;
  private edgeLowU: Curve | null;
  private edgeHighU: Curve | null;
  private edgeLowV: Curve | null;
  private edgeHighV: Curve | null;

  constructor(
    private weightedControlPoints: Vec4[][],
    private uKnots: number[],
    private vKnots: number[],
    private degreeU: number,
    private degreeV: number,
    parent: Geometry | null = null,
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null,
  ) {
    super(parent, model, material);
    this.mesh = null;
    this.edgeLowU = null;
    this.edgeHighU = null;
    this.edgeLowV = null;
    this.edgeHighV = null;
    this.update();
  }

  public delete(): void {
    this.mesh?.destroy();
    this.edgeLowU?.destroy();
    this.edgeHighU?.destroy();
    this.edgeLowV?.destroy();
    this.edgeHighV?.destroy();
  }

  public getBoundingBox(): BoundingBox {
    return this.mesh!.getBoundingBox();
  }

  public intersect(ray: Ray): Intersection | null {
    // TODO: come back to this...
    return this.mesh!.intersect(ray);
  }

  public override getTypeName(): string {
    return "Surface";
  }

  private update(): void {
    this.delete();

    const sampleCountU: number = Curve.SAMPLES_PER_EDGE * (this.weightedControlPoints.length - 1);
    const sampleCountV: number = Curve.SAMPLES_PER_EDGE * (this.weightedControlPoints[0].length - 1);

    const firstKnotU: number = this.uKnots[0];
    const firstKnotV: number = this.vKnots[0];

    const knotSizeU: number = this.uKnots[this.uKnots.length - 1] - firstKnotU;
    const knotSizeV: number = this.vKnots[this.vKnots.length - 1] - firstKnotV;

    const stepU: number = knotSizeU / sampleCountU;
    const stepV: number = knotSizeV / sampleCountV;

    const meshVerts: Vec3[] = [];
    const meshNormals: Vec3[] = [];
    const meshIndices: number[] = [];

    for (let i = 0; i <= sampleCountU; i++) {
      for (let j = 0; j <= sampleCountV; j++) {
        meshVerts.push(this.sample(firstKnotU + i * stepU, firstKnotV + j * stepV));
      }
    }
    for (let i = 0; i < sampleCountU; i++) {
      for (let j = 0; j < sampleCountV; j++) {
        meshIndices.push(i * (sampleCountV + 1) + j);
        meshIndices.push(i * (sampleCountV + 1) + j + 1);
        meshIndices.push((i + 1) * (sampleCountV + 1) + j);
        meshIndices.push(i * (sampleCountV + 1) + j + 1);
        meshIndices.push((i + 1) * (sampleCountV + 1) + j + 1);
        meshIndices.push((i + 1) * (sampleCountV + 1) + j);
      }
    }
    for (let i = 0; i <= sampleCountU; i++) {
      for (let j = 0; j <= sampleCountV; j++) {
        const v1: Vec3 = (i == 0)
          ? vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[(i + 1) * (sampleCountV + 1) + j])
          : vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[(i - 1) * (sampleCountV + 1) + j]);
        const v2: Vec3 = (j == 0)
          ? vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[i * (sampleCountV + 1) + j + 1])
          : vec3.sub(meshVerts[i * (sampleCountV + 1) + j], meshVerts[i * (sampleCountV + 1) + j - 1]);
        var normal: Vec3 = vec3.normalize(vec3.cross(v1, v2));
        if (i == 0) normal = vec3.scale(normal, -1);
        if (j == 0) normal = vec3.scale(normal, -1);
        meshNormals.push(normal);
      }
    }

    this.mesh = new Mesh(this, meshVerts, meshNormals, meshIndices);
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    return this.mesh!.isWithinFrustum(frustum, inclusive);
  }

  public sample(u: number, v: number): Vec3 {
    const uSpan: number = span(this.uKnots, u, this.degreeU);
    const vSpan: number = span(this.vKnots, v, this.degreeV);
    const basisFuncsU: number[] = basisFuncs(this.uKnots, u, this.degreeU);
    const basisFuncsV: number[] = basisFuncs(this.vKnots, v, this.degreeV);
    var res: Vec4 = vec4.create(0, 0, 0, 0);
    for (let i = 0; i <= this.degreeU; i++) {
      for (let j = 0; j <= this.degreeV; j++) {
        res = vec4.add(res, vec4.scale(
          this.weightedControlPoints[uSpan - this.degreeU + i][vSpan - this.degreeV + j],
          basisFuncsV[j] * basisFuncsU[i]
        ));
      }
    }
    return vec3.create(res[0] / res[3], res[1] / res[3], res[2] / res[3]);
  }
}
