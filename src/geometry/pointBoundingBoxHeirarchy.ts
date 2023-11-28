import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";
import { cloneVec3List } from "../utils/clone";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";
import { Intersection } from "./intersection";
import { Ray } from "./ray";


enum Axis {
  X = 0,
  Y = 1,
  Z = 2,
}


class PointBoundingBoxHeirarchyNode {

  private indices!: number[] | null;
  private child1!: PointBoundingBoxHeirarchyNode | null;
  private child2!: PointBoundingBoxHeirarchyNode | null;
  private boundingBox!: BoundingBox;
  private axis!: Axis;

  constructor(
    private geometry: Geometry,
    private verts: Vec3[],
    indices: number[],
    private depth: number = 0
  ) {
    this.setup(indices);
  }

  private setup(indices: number[]): void {
    this.axis = this.depth % 3;
    this.boundingBox = new BoundingBox();
    let average: Vec3 = vec3.create(0, 0, 0);
    for (const index of indices) {
      this.boundingBox.addVec3(this.verts[index]);
      average = vec3.add(average, this.verts[index]);
    }
    average = vec3.scale(average, 1 / (indices.length));

    if (indices.length < PointBoundingBoxHeirarchy.MAX_POINTS_PER_LEAF ||
      this.boundingBox.hasNoVolume()
    ) {
      this.indices = indices;
      this.child1 = null;
      this.child2 = null;
    } else {
      this.indices = null;
      const child1Indices: number[] = [];
      const child2Indices: number[] = [];
      for (const index of indices) {
        if (this.verts[index][this.axis] < average[this.axis]) {
          child1Indices.push(index);
        } else {
          child2Indices.push(index);
        }
      }
      this.child1 = new PointBoundingBoxHeirarchyNode(this.geometry, this.verts, child1Indices, this.depth + 1);
      this.child2 = new PointBoundingBoxHeirarchyNode(this.geometry, this.verts, child2Indices, this.depth + 1);
    }
  }

  public almostIntersect(ray: Ray, pixels: number): Intersection | null {

    if (ray.almostIntersectBoundingBox(this.boundingBox, pixels) === null) {
      return null;
    }

    if (this.isLeaf()) {
      let closestIntersection: Intersection | null = null;
      for (const index of this.indices!) {
        let intersection: Intersection | null = ray.almostIntersectPoint(this.geometry, index, this.verts[index], pixels);
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

  private isLeaf(): boolean {
    return this.indices! !== null;
  }

}

export class PointBoundingBoxHeirarchy {

  static readonly MAX_POINTS_PER_LEAF: number = 5; // TODO: tune

  private root: PointBoundingBoxHeirarchyNode;

  constructor(
    private geometry: Geometry,
    verts: Vec3[]
  ) {
    const indices: number[] = [];
    for (let i = 0; i < indices.length; i++) indices.push(i);
    this.root = new PointBoundingBoxHeirarchyNode(this.geometry, verts, indices);
  }

  public almostIntersect(ray: Ray, pixels: number): Intersection | null {

    const model: Mat4 = this.geometry.getModelRecursive();
    const objectSpaceRay: Ray = Ray.transform(ray, mat4.inverse(model));
    var res: Intersection | null = this.root.almostIntersect(objectSpaceRay, pixels);
    if (res) res.point = vec3.transformMat4(res.point, model);
    return res;

  }



}
