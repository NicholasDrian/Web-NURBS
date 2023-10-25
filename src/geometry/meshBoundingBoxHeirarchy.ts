import { vec3, Vec3 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";
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
    verts: Vec3[],
    indices: number[],
    private depth: number = 0
  ) {
    this.setup(verts, indices);
  }

  private setup(verts: Vec3[], indices: number[]): void {
    this.axis = this.depth % 3;
    this.boundingBox = new BoundingBox();
    for (let index of indices) {
      this.boundingBox.addVec3(verts[index]);
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
          verts[indices[i]],
          vec3.add(
            verts[indices[i + 1]],
            verts[indices[i + 1]]
          )
        ), 1 / 3);
        const bbCenter = this.boundingBox.getCenter();
        if (triCenter[this.axis] < bbCenter[this.axis]) {
          child1Indices.push(indices[i], indices[i + 1], indices[i + 2]);
        } else {
          child2Indices.push(indices[i], indices[i + 1], indices[i + 2]);
        }
      }
      this.child1 = new MeshBoundingBoxHeirarchyNode(verts, child1Indices, this.depth + 1);
      this.child2 = new MeshBoundingBoxHeirarchyNode(verts, child2Indices, this.depth + 1);
    }
  }

  public add(indices: [number, number, number], verts: Vec3[]): void {
    if (this.isLeaf()) {
      this.indices!.push(...indices);
      if (this.indices!.length / 3 < MeshBoundingBoxHeirarchy.MAX_TRIS_PER_LEAF) {
        this.setup(verts, this.indices!);
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

  public intersect(ray: Ray, verts: Vec3[]): number | null {

    if (ray.intersectBoundingBox(this.boundingBox) === null) return null;

    if (this.isLeaf()) {
      var res: number | null = null;
      for (let i = 0; i < this.indices!.length; i += 3) {
        var t: number | null = ray.intersectTriangle(verts[this.indices![i]], verts[this.indices![i + 1]], verts[this.indices![i + 2]]);
        if (t !== null) {
          if (res === null) res = t;
          else res = Math.min(res, t);
        }
      }
      return res;
    } else {
      const t1 = this.child1!.intersect(ray, verts);
      const t2 = this.child2!.intersect(ray, verts);
      if (t1 === null) return t2;
      if (t2 === null) return t1;
      return Math.min(t1, t2);
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

  constructor(verts: Vec3[], indices: number[]) {
    this.root = new MeshBoundingBoxHeirarchyNode(verts, indices);
  }

  public print(): void {
    console.log("========Mesh-BBH========");
    this.root.print();
  }

  public intersect(ray: Ray, verts: Vec3[]): number | null {
    return this.root.intersect(ray, verts);
  }

}
