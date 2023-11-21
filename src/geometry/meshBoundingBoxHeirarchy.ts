import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { ObjectID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";

enum Axis {
  X = 0,
  Y = 1,
  Z = 2,
}

class MeshBoundingBoxHeirarchyNode {

  private indices!: number[] | null;
  private child1!: MeshBoundingBoxHeirarchyNode | null;
  private child2!: MeshBoundingBoxHeirarchyNode | null;
  private boundingBox!: BoundingBox;
  private axis!: Axis;

  constructor(
    private id: ObjectID,
    private verts: Vec3[],
    indices: number[],
    private depth: number = 0
  ) {
    this.setup(indices);
  }

  private setup(indices: number[]): void {
    this.axis = this.depth % 3;
    this.boundingBox = new BoundingBox();
    for (let index of indices) {
      this.boundingBox.addVec3(this.verts[index]);
    }
    if (indices.length / 3 <= MeshBoundingBoxHeirarchy.MAX_TRIS_PER_LEAF) {
      // leaf
      this.indices = indices;
      this.child1 = null;
      this.child2 = null;
    } else {
      // non leaf
      this.indices = null;
      const child1Indices: number[] = [];
      const child2Indices: number[] = [];
      for (let i = 0; i < indices.length; i += 3) {
        const triCenter = vec3.scale(vec3.add(
          this.verts[indices[i]],
          vec3.add(
            this.verts[indices[i + 1]],
            this.verts[indices[i + 2]]
          )
        ), 1 / 3);
        if (triCenter[this.axis] < this.boundingBox.getCenter()[this.axis]) {
          child1Indices.push(indices[i], indices[i + 1], indices[i + 2]);
        } else {
          child2Indices.push(indices[i], indices[i + 1], indices[i + 2]);
        }
      }
      this.child1 = new MeshBoundingBoxHeirarchyNode(this.id, this.verts, child1Indices, this.depth + 1);
      this.child2 = new MeshBoundingBoxHeirarchyNode(this.id, this.verts, child2Indices, this.depth + 1);
    }
  }

  public add(indices: [number, number, number], verts: Vec3[]): void {
    if (this.isLeaf()) {
      this.indices!.push(...indices);
      if (this.indices!.length / 3 < MeshBoundingBoxHeirarchy.MAX_TRIS_PER_LEAF) {
        this.setup(this.indices!);
      }
    } else {
      const triCenterPoint = vec3.scale(vec3.add(
        verts[indices[0]],
        vec3.add(
          verts[indices[1]],
          verts[indices[2]]
        )
      ), 1 / 3);
      const bbCenterPoint = this.boundingBox.getCenter();
      if (triCenterPoint[this.axis] < bbCenterPoint[this.axis]) {
        this.child1!.add(indices, verts);
      } else {
        this.child2!.add(indices, verts);
      }
    }
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (frustum.containsBoundingBoxFully(this.boundingBox)) return true;

    if (!frustum.intersectsBoundingBox(this.boundingBox)) return false;

    if (this.isLeaf()) {
      if (inclusive) {
        for (let i = 0; i < this.indices!.length; i += 3) {
          if (frustum.containsTriangle(
            this.verts[this.indices![i]],
            this.verts[this.indices![i + 1]],
            this.verts[this.indices![i + 2]],
            inclusive)) {
            return true;
          }
        }
        return false;
      } else {
        for (let i = 0; i < this.indices!.length; i += 3) {
          if (!frustum.containsTriangle(
            this.verts[this.indices![i]],
            this.verts[this.indices![i + 1]],
            this.verts[this.indices![i + 2]],
            inclusive)) {
            return false;
          }
        }
        return true;
      }
    } else {
      if (inclusive) {
        return this.child1!.isWithinFrustum(frustum, inclusive) || this.child2!.isWithinFrustum(frustum, inclusive);
      } else {
        return this.child1!.isWithinFrustum(frustum, inclusive) && this.child2!.isWithinFrustum(frustum, inclusive);
      }
    }

  }

  public intersect(ray: Ray): Intersection | null {


    if (ray.intersectBoundingBox(this.boundingBox) === null) return null;


    if (this.isLeaf()) {
      var res: number | null = null;
      for (let i = 0; i < this.indices!.length; i += 3) {
        var t: number | null = ray.intersectTriangle(
          this.verts[this.indices![i]],
          this.verts[this.indices![i + 1]],
          this.verts[this.indices![i + 2]]);
        if (t !== null) {
          if (res === null) res = t;
          else res = Math.min(res, t);
        }
      }
      if (res == null) return res;
      return new Intersection(res, "mesh", this.id, ray.at(res), 0, 0);
    } else {
      const i1: Intersection | null = this.child1!.intersect(ray);
      const i2: Intersection | null = this.child2!.intersect(ray);
      if (i1 === null) return i2;
      if (i2 === null) return i1;
      return (i1!.time < i2!.time) ? i1! : i2!;
    }
  }

  public isLeaf(): boolean {
    return this.indices !== null;
  }

  public print(): void {
    let str: string = "";
    for (let i = 0; i < this.depth; i++) str += "->";
    if (this.indices) str += `${this.indices.length / 3}triangles`;
    else str += "node";
    console.log(str);
    this.child1?.print();
    this.child2?.print();
  }

}

export class MeshBoundingBoxHeirarchy {

  public static readonly MAX_TRIS_PER_LEAF = 5;

  private root: MeshBoundingBoxHeirarchyNode;

  constructor(private mesh: Geometry, verts: Vec3[], indices: number[]) {
    // degenerates breaks the bbh
    const reducedIndices: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const d1: number = vec3.distance(verts[indices[i]], verts[indices[i + 1]]);
      const d2: number = vec3.distance(verts[indices[i + 1]], verts[indices[i + 2]]);
      const d3: number = vec3.distance(verts[indices[i + 2]], verts[indices[i]]);
      if (d1 === 0 || d2 === 0 || d3 === 0) continue;
      reducedIndices.push(indices[i], indices[i + 1], indices[i + 2]);
    }
    this.root = new MeshBoundingBoxHeirarchyNode(this.mesh.getID(), verts, reducedIndices);
  }

  public print(): void {
    console.log("========Mesh-BBH========");
    this.root.print();
  }
  public firstIntersection(ray: Ray): Intersection | null {
    var model: Mat4 = this.mesh.getModelRecursive();
    const objectSpaceRay: Ray = Ray.transform(ray, mat4.inverse(model));
    const res: Intersection | null = this.root.intersect(objectSpaceRay);
    res?.transform(model);
    return res;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {

    frustum.transform(mat4.inverse(this.mesh.getModelRecursive()));
    const res: boolean = this.root.isWithinFrustum(frustum, inclusive);
    frustum.transform(this.mesh.getModelRecursive());
    return res;
  }

}
