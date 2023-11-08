import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Ray } from "./ray";
import { InstancedMesh } from "./instancedMesh";
import { Intersection } from "./intersection";
import { Frustum } from "./frustum";


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
    points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.instancedMesh = null;
    this.update(points);
  }

  private update(points: Vec3[]): void {
    if (this.instancedMesh) this.instancedMesh.destroy();

    const transforms: Mat4[] = [];
    for (let i = 0; i < points.length; i++) {

      const pointXZY: Vec3 = vec3.create(points[i][0], points[i][2], points[i][1]);
      var translation: Mat4 = mat4.translate(mat4.identity(), pointXZY);

      var scale: Mat4 = mat4.scale(mat4.identity(), vec3.create(0.01, 0.01, 0.01));

      // make sure point scale is not affected by model scale
      var modelScale: Mat4 = mat4.scaling(mat4.getScaling(this.getModel()));

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

  public delete(): void {
    this.instancedMesh!.destroy();
  }

  public override getTypeName(): string {
    return "Points";
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    throw new Error("Method not implemented.");
  }


  public override getBoundingBox(): BoundingBox {
    return this.instancedMesh!.getBoundingBox();
  }
  public override intersect(ray: Ray): Intersection | null {
    return this.instancedMesh!.intersect(ray);
  }

}
