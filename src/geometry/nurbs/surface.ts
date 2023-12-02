import { mat4, Mat4, vec3, Vec3, vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { MaterialName } from "../../materials/material";
import { cloneVec4ListList } from "../../utils/clone";
import { BoundingBox } from "../boundingBox";
import { ControlCage2D } from "../controlCage2D";
import { Frustum } from "../frustum";
import { Geometry } from "../geometry";
import { Intersection } from "../intersection";
import { Mesh } from "../mesh";
import { Ray } from "../ray";
import { Curve } from "./curve";
import { basisFuncs, span } from "./utils";


export class Surface extends Geometry {

  private mesh: Mesh | null;
  private controlCage: ControlCage2D | null;

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
    this.controlCage = null;
    this.update();
  }

  public showControls(on: boolean): void {
    if (on) this.controlCage!.show();
    else this.controlCage!.hide();
  }

  public addToSubSelection(subID: number): void {
    this.controlCage!.addToSubSelection(subID);
  }

  public removeFromSubSelection(subID: number): void {
    this.controlCage!.removeFromSubSelection(subID);
  }

  public isSubSelected(subID: number): boolean {
    return this.controlCage!.isSubSelected(subID);
  }

  public clearSubSelection(): void {
    this.controlCage!.clearSubSelection();
  }

  public getSubSelectionBoundingBox(): BoundingBox {
    return this.controlCage!.getSubSelectionBoundingBox();
  }
  public getControlCage(): ControlCage2D {
    return this.controlCage!;
  }

  public onSelectionMoved(): void {
    if (this.controlCage!.hasSubSelection()) {
      const newVerts: Vec3[][] = this.controlCage!.getVertsSubSelectionTransformed();
      for (let i = 0; i < this.weightedControlPoints.length; i++) {
        for (let j = 0; j < this.weightedControlPoints[0].length; j++) {
          const newVert: Vec3 = newVerts[i][j];
          const weight: number = this.weightedControlPoints[i][j][3];
          this.weightedControlPoints[i][j] = vec4.create(
            newVert[0] * weight,
            newVert[1] * weight,
            newVert[2] * weight,
            weight
          );
        }
      }
      this.update(false);
    }
  }

  public bakeSelectionTransform(): void {
    if (this.isSelected()) {
      this.model = mat4.mul(INSTANCE.getMover().getTransform(), this.model);
    }
    this.controlCage!.bakeSelectionTransform();
  }


  public delete(): void {
    this.mesh?.delete();
    this.controlCage?.delete();
  }

  public clone(): Geometry {
    const res: Surface = new Surface(cloneVec4ListList(
      this.weightedControlPoints),
      [...this.uKnots], [...this.vKnots],
      this.degreeU, this.degreeV,
      this.parent, mat4.clone(this.model),
      this.materialName);
    if (!this.controlCage!.isHidden()) {
      res.showControls(true);
    }
    return res;
  }

  public getMesh(): Mesh {
    return this.mesh!;
  }

  public getBoundingBox(): BoundingBox {
    return this.controlCage!.getBoundingBox();
  }

  public intersect(ray: Ray, sub: boolean): Intersection | null {

    if (this.isHidden()) return null;

    let intersection: Intersection | null = null;

    if (sub) { // order of intersection attempts depends if its sub
      intersection = this.controlCage!.intersect(ray, sub);
      if (intersection) {
        intersection.description = "control cage";
        return intersection;
      }
      intersection = this.mesh!.intersect(ray, sub);
      if (intersection) {
        intersection.description = "surface";
        return intersection;
      }
    } else {
      intersection = this.mesh!.intersect(ray, sub);
      if (intersection) {
        intersection.description = "surface";
        return intersection;
      }
      intersection = this.controlCage!.intersect(ray, sub);
      if (intersection) {
        intersection.description = "control cage";
        return intersection;
      }
    }
    return intersection;

  }

  public override getTypeName(): string {
    return "Surface";
  }

  private update(updateCage: boolean = true): void {

    if (updateCage) this.controlCage?.delete();
    this.mesh?.delete();

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

    INSTANCE.getStats().onTrianglesCreated(meshIndices.length / 3);

    this.mesh = new Mesh(this, meshVerts, meshNormals, meshIndices);
    if (updateCage) this.controlCage = new ControlCage2D(this, this.weightedControlPoints.map((points: Vec4[]) => {
      return points.map((point: Vec3) => {
        return vec3.create(point[0] / point[3], point[1] / point[3], point[2] / point[3]);
      })
    }));

  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
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
