import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Ray } from "./ray";
import { InstancedMesh } from "./instancedMesh";
import { Intersection } from "./intersection";
import { Frustum } from "./frustum";
import { INSTANCE } from "../cad";
import { cloneVec3List } from "../utils/clone";


const unitPointVerts: Vec3[] = [
  vec3.create(1, 0, 0),
  vec3.create(0, 1, 0),
  vec3.create(0, 0, 1),
  vec3.create(-1, 0, 0),
  vec3.create(0, -1, 0),
  vec3.create(0, 0, -1),
];

const unitPointIndices: number[] = [
  0, 1, 2,
  0, 2, 4,
  0, 4, 5,
  0, 5, 1,

  3, 1, 5,
  3, 5, 4,
  3, 4, 2,
  3, 2, 1,
]

// use instanced mesh
export class Points extends Geometry {

  private instancedMesh: InstancedMesh | null;

  constructor(
    parent: Geometry | null,
    private points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.instancedMesh = null;
    this.update();
  }

  public addToSubSelection(subID: number): void {
    throw new Error("Method not implemented.");
  }
  public removeFromSubSelection(subID: number): void {
    throw new Error("Method not implemented.");
  }
  public isSubSelected(subID: number): boolean {
    throw new Error("Method not implemented.");
  }
  public clearSubSelection(): void {
    throw new Error("Method not implemented.");
  }
  public getSubSelectionBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public onSelectionMoved(): void {
    throw new Error("Method not implemented.");
  }
  public bakeSelectionTransform(): void {
    throw new Error("Method not implemented.");
  }

  private update(): void {

    this.instancedMesh?.delete();

    const transforms: Mat4[] = [];
    for (let i = 0; i < this.points.length; i++) {

      const pointXZY: Vec3 = vec3.create(this.points[i][0], this.points[i][2], this.points[i][1]);
      var translation: Mat4 = mat4.translation(pointXZY);

      var scale: Mat4 = mat4.scale(mat4.identity(), vec3.create(0.01, 0.01, 0.01));

      // make sure point scale is not affected by model scale
      var modelScale: Mat4 = mat4.scaling(mat4.getScaling(this.getModelRecursive()));

      var transform: Mat4 = mat4.multiply(
        translation,
        mat4.multiply(
          scale,
          mat4.inverse(modelScale)
        )
      );

      transforms.push(transform);
    }

    this.instancedMesh = new InstancedMesh(this, unitPointVerts, unitPointVerts, unitPointIndices, transforms);
  }

  public clone(): Geometry {
    return new Points(this.parent, cloneVec3List(this.points), mat4.clone(this.model), this.materialName);
  }

  public override delete(): void {
    this.instancedMesh!.delete();
    INSTANCE.getScene().removeGeometry(this);
  }

  public override getTypeName(): string {
    return "Points";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (this.isHidden()) return false;
    throw new Error("Method not implemented.");
  }


  public override getBoundingBox(): BoundingBox {
    return this.instancedMesh!.getBoundingBox();
  }
  public override intersect(ray: Ray): Intersection | null {
    if (this.isHidden()) return null;
    return this.instancedMesh!.intersect(ray);
  }

}
