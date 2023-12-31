import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
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

  private triangles!: number[] | null;
  private child1!: MeshBoundingBoxHeirarchyNode | null;
  private child2!: MeshBoundingBoxHeirarchyNode | null;
  private boundingBox!: BoundingBox;
  private axis!: Axis;

  constructor(
    private mesh: Geometry,
    private verts: Vec3[],
    private indices: number[],
    triangles: number[],
    private depth: number = 0
  ) {
    this.setup(triangles);
  }

  private setup(triangles: number[]): void {


    this.axis = this.depth % 3;
    this.boundingBox = new BoundingBox();

    for (const tri of triangles) {
      this.boundingBox.addVec3(this.verts[this.indices[tri * 3]]);
      this.boundingBox.addVec3(this.verts[this.indices[tri * 3 + 1]]);
      this.boundingBox.addVec3(this.verts[this.indices[tri * 3 + 2]]);
    }

    if (triangles.length <= MeshBoundingBoxHeirarchy.MAX_TRIS_PER_LEAF) {
      // leaf
      this.triangles = triangles;
      this.child1 = null;
      this.child2 = null;
    } else {
      // non leaf
      this.triangles = null;
      var child1Tris: number[] = [];
      var child2Tris: number[] = [];
      for (const tri of triangles) {
        const center: Vec3 = vec3.scale(
          vec3.add(
            this.verts[this.indices[tri * 3]],
            vec3.add(
              this.verts[this.indices[tri * 3 + 1]],
              this.verts[this.indices[tri * 3 + 2]])
          ), 1 / 3);
        if (center[this.axis] < this.boundingBox.getCenter()[this.axis]) {
          child1Tris.push(tri);
        } else {
          child2Tris.push(tri);
        }
      }
      if (child1Tris.length === 0 || child2Tris.length === 0) {
        child1Tris = triangles.slice(0, triangles.length / 2);
        child2Tris = triangles.slice(triangles.length / 2, -1);
      }
      this.child1 = new MeshBoundingBoxHeirarchyNode(this.mesh, this.verts, this.indices, child1Tris, this.depth + 1);
      this.child2 = new MeshBoundingBoxHeirarchyNode(this.mesh, this.verts, this.indices, child2Tris, this.depth + 1);
    }
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {

    if (frustum.containsBoundingBoxFully(this.boundingBox)) return true;

    if (!frustum.intersectsBoundingBox(this.boundingBox)) return false;

    if (this.isLeaf()) {
      if (inclusive) {
        for (const tri of this.triangles!) {
          if (frustum.containsTriangle(
            this.verts[this.indices![tri * 3]],
            this.verts[this.indices![tri * 3 + 1]],
            this.verts[this.indices![tri * 3 + 2]],
            inclusive)) {
            return true;
          }
        }
        return false;
      } else {
        for (let tri of this.triangles!) {
          if (!frustum.containsTriangle(
            this.verts[this.indices![tri * 3]],
            this.verts[this.indices![tri * 3 + 1]],
            this.verts[this.indices![tri * 3 + 2]],
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

  public getWithinFrustumSub(frustum: Frustum, inclusive: boolean): number[] {
    if (frustum.containsBoundingBoxFully(this.boundingBox)) return this.getAllTris();
    if (!frustum.intersectsBoundingBox(this.boundingBox)) return [];

    if (this.isLeaf()) {
      const res: number[] = [];
      for (const tri of this.triangles!) {
        if (frustum.containsTriangle(
          this.verts[this.indices[tri * 3]],
          this.verts[this.indices[tri * 3 + 1]],
          this.verts[this.indices[tri * 3 + 2]],
          inclusive
        )) {
          res.push(tri);
        }
      }
      return res;
    } else {
      const res: number[] = this.child1!.getWithinFrustumSub(frustum, inclusive);
      res.push(...this.child2!.getWithinFrustumSub(frustum, inclusive));
      return res;
    }
  }

  getAllTris(): number[] {
    if (this.isLeaf()) {
      return [...this.triangles!];
    } else {
      const res = this.child1!.getAllTris();
      res.push(...this.child2!.getAllTris());
      return res;
    }
  }

  public intersect(ray: Ray): Intersection | null {
    if (ray.intersectBoundingBox(this.boundingBox) === null) return null;
    if (this.isLeaf()) {
      var res: number | null = null;
      var subID: number | null = null;

      for (const tri of this.triangles!) {
        var t: number | null = ray.intersectTriangle(
          this.verts[this.indices![tri * 3]],
          this.verts[this.indices![tri * 3 + 1]],
          this.verts[this.indices![tri * 3 + 2]]);
        if (t !== null) {
          if (res === null || t < res) {
            res = t;
            subID = tri;
          }
        }
      }
      if (res == null) return res;
      return new Intersection(res, "mesh", this.mesh, subID!, ray.at(res), 0, 0);
    } else {
      const i1: Intersection | null = this.child1!.intersect(ray);
      const i2: Intersection | null = this.child2!.intersect(ray);
      if (i1 === null) return i2;
      if (i2 === null) return i1;
      return (i1!.time < i2!.time) ? i1! : i2!;
    }
  }

  public isLeaf(): boolean {
    return this.triangles !== null;
  }

  public print(): void {
    let str: string = "";
    for (let i = 0; i < this.depth; i++) str += "->";
    if (this.triangles) str += `${this.triangles.length / 3}triangles`;
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
    const triangles: number[] = [];
    for (let i = 0; i < indices.length; i += 3) { triangles.push(i / 3); }
    this.root = new MeshBoundingBoxHeirarchyNode(this.mesh, verts, indices, triangles);
  }

  public print(): void {
    console.log("========Mesh-BBH========");
    this.root.print();
  }
  public firstIntersection(ray: Ray): Intersection | null {
    var model: Mat4 = this.mesh.getModelRecursive();
    const objectSpaceRay: Ray = Ray.transform(ray, mat4.inverse(model));
    const res: Intersection | null = this.root.intersect(objectSpaceRay);
    res?.transform(model, objectSpaceRay);
    return res;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {

    // BUG: some transforms cannot be inverted
    frustum.transform(mat4.inverse(this.mesh.getModelRecursive()));
    const res: boolean = this.root.isWithinFrustum(frustum, inclusive);
    frustum.transform(this.mesh.getModelRecursive());
    return res;
  }

  public getWithinFrustumSub(frustum: Frustum, inclusive: boolean): number[] {

    // BUG: some transforms cannot be inverted
    frustum.transform(mat4.inverse(this.mesh.getModelRecursive()));
    const res: number[] = this.root.getWithinFrustumSub(frustum, inclusive);
    frustum.transform(this.mesh.getModelRecursive());
    return res;
  }

}
