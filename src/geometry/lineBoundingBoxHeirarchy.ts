import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";

enum Axis {
  X = 0,
  Y = 1,
  Z = 2
}

class LineBoundingBoxHeirarchyNode {

  private lines!: number[] | null;
  private child1!: LineBoundingBoxHeirarchyNode | null;
  private child2!: LineBoundingBoxHeirarchyNode | null;
  private boundingBox!: BoundingBox;
  private axis!: Axis;

  constructor(
    private geometry: Geometry,
    private verts: Vec3[],
    private indices: number[],
    lines: number[],
    private depth: number = 0
  ) {
    this.setup(lines);
  }

  private setup(lines: number[]): void {
    this.axis = this.depth % 3;
    this.boundingBox = new BoundingBox();
    for (const line of lines) {
      this.boundingBox.addVec3(this.verts[this.indices[line * 2]]);
      this.boundingBox.addVec3(this.verts[this.indices[line * 2 + 1]]);
    }

    if (lines.length <= LineBoundingBoxHeirarchy.MAX_LINES_PER_LEAF) {
      // leaf
      this.lines = lines;
      this.child1 = null;
      this.child2 = null;
    } else {
      // non leaf
      this.lines = null;

      let child1Lines: number[] = [];
      let child2Lines: number[] = [];
      for (const line of lines) {
        const center: Vec3 = vec3.scale(
          vec3.add(
            this.verts[this.indices[2 * line]],
            this.verts[this.indices[2 * line + 1]]),
          0.5
        );
        if (center[this.axis] < this.boundingBox.getCenter()[this.axis]) {
          child1Lines.push(line);
        } else {
          child2Lines.push(line);
        }
      }
      if (child1Lines.length === 0 || child2Lines.length === 0) {
        child1Lines = lines.slice(0, lines.length / 2);
        child2Lines = lines.slice(lines.length / 2, -1);
      }
      this.child1 = new LineBoundingBoxHeirarchyNode(this.geometry, this.verts, this.indices, child1Lines, this.depth + 1);
      this.child2 = new LineBoundingBoxHeirarchyNode(this.geometry, this.verts, this.indices, child2Lines, this.depth + 1);
    }
  }

  isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    if (frustum.containsBoundingBoxFully(this.boundingBox)) return true;
    if (!frustum.intersectsBoundingBox(this.boundingBox)) return false;
    if (this.isLeaf()) {
      if (inclusive) {
        for (const line of this.lines!) {
          if (frustum.containsLinePartially(
            this.verts[this.indices[line * 2]],
            this.verts[this.indices[line * 2 + 1]]
          )) {
            return true;
          }
        }
        return false;
      } else {
        for (const line of this.lines!) {
          if (!frustum.containsLineFully(
            this.verts[this.indices[line * 2]],
            this.verts[this.indices[line * 2 + 1]]
          )) {
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

  public almostIntersect(ray: Ray, pixels: number): Intersection | null {

    if (ray.almostIntersectBoundingBox(this.boundingBox, pixels) === null) return null;

    if (this.isLeaf()) {
      // time, dist
      let closestIntersection: Intersection | null = null;
      for (const line of this.lines!) {
        let intersection: Intersection | null = ray.almostIntersectLine(this.geometry, line,
          this.verts[this.indices[line * 2]],
          this.verts[this.indices[line * 2 + 1]],
          pixels);
        if (intersection !== null) {
          if (closestIntersection === null || intersection.screenSpaceDist < closestIntersection.screenSpaceDist) {
            closestIntersection = intersection;
          }
        }
      }
      return closestIntersection;
    } else {
      const t1 = this.child1!.almostIntersect(ray, pixels);
      const t2 = this.child2!.almostIntersect(ray, pixels);
      if (t1 === null) return t2;
      if (t2 === null) return t1;
      return (t1.time < t2.time) ? t1 : t2;
    }
  }

  public isLeaf(): boolean {
    return this.lines !== null;
  }

  public print(): void {
    let str: string = "";
    for (let i = 0; i < this.depth; i++) str += "->";
    if (this.indices) str += `${this.indices.length / 2}lines`;
    else str += "node";
    console.log(str);
    this.child1?.print();
    this.child2?.print();
  }

}

export class LineBoundingBoxHeirarchy {

  public static readonly MAX_LINES_PER_LEAF = 5;

  private root: LineBoundingBoxHeirarchyNode;

  constructor(
    private geometry: Geometry,
    verts: Vec3[],
    indices: number[]) {
    const lines: number[] = [];
    for (let i = 0; i < indices.length / 2; i++) { lines.push(i); }
    this.root = new LineBoundingBoxHeirarchyNode(this.geometry, verts, indices, lines);
  }

  public print(): void {
    console.log("========Line-BBH========");
    this.root.print();
  }



  public almostIntersect(ray: Ray, pixels: number): Intersection | null {
    const model: Mat4 = this.geometry.getModelRecursive();
    const objectSpaceRay: Ray = Ray.transform(ray, mat4.inverse(model));
    const res: Intersection | null = this.root.almostIntersect(objectSpaceRay, pixels);
    res?.transform(model, objectSpaceRay);
    return res;
  }

  public isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean {
    frustum.transform(mat4.inverse(this.geometry.getModelRecursive()));
    const res: boolean = this.root.isWithinFrustum(frustum, inclusive);
    frustum.transform(this.geometry.getModelRecursive());
    return res;
  }
}
