import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { MaterialName } from "../materials/material";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Ray } from "./ray";
import { Mesh } from "./mesh"


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

  private mesh: Mesh | null;

  constructor(
    parent: Geometry | null,
    points: Vec3[],
    model: Mat4 = mat4.identity(),
    material: MaterialName | null = null
  ) {
    super(parent, model, material);
    this.mesh = null;
    this.update(points);
  }

  private update(points: Vec3[]): void {
    if (this.mesh) this.mesh.destroy();

    const verts: Vec3[] = []
    for (let i = 0; i < points.length; i++) {

    }


    // TODO:
    //this.mesh = new Mesh(this, verts, points,)
  }

  public delete(): void {
  }


  public override getBoundingBox(): BoundingBox {
    throw new Error("Method not implemented.");
  }
  public override intersect(ray: Ray): number | null {
    throw new Error("Method not implemented.");
  }

}
