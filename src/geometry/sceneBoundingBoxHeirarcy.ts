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

class BBHNode {

  private axis!: Axis;
  private child1!: BBHNode | null;
  private child2!: BBHNode | null;
  private geometry!: Geometry[] | null;
  private boundingBox!: BoundingBox;

  constructor(
    geometry: Geometry[],
    private depth: number,
  ) {
    this.setup(geometry, depth);
  }

  private setup(geometry: Geometry[], depth: number): void {
    this.axis = depth % 3;
    this.boundingBox = new BoundingBox();
    geometry.forEach((geo: Geometry) => { this.boundingBox.addBoundingBox(geo.getBoundingBox()); });

    if (geometry.length <= SceneBoundingBoxHeirarchy.MAX_GEOMETRY_PER_LEAF) {
      // leaf
      this.geometry = geometry;
      this.child1 = null;
      this.child2 = null;
    } else {
      // not a leaf
      this.geometry = null;
      const center: number = this.boundingBox.getCenter()[this.axis];
      const child1Geometry: Geometry[] = [];
      const child2Geometry: Geometry[] = [];
      geometry.forEach((geo: Geometry) => {
        if (geo.getBoundingBox().getCenter()[this.axis] < center) {
          child1Geometry.push(geo);
        } else {
          child2Geometry.push(geo);
        }
      });
      this.child1 = new BBHNode(child1Geometry, depth + 1);
      this.child2 = new BBHNode(child2Geometry, depth + 1);
    }
  }
  public firstIntersectionsWithinMargin(ray: Ray, margin: number): Intersection[] {
    const res: Intersection[] = [];
    if (ray.intersectBoundingBox(this.boundingBox) === null) return res;

    if (this.isLeaf()) {
      this.geometry!.forEach((geo: Geometry) => {
        const intersection: Intersection | null = geo.intersect(ray);
        if (intersection !== null) res.push(intersection);
      });
    } else {
      res.push(...this.child1!.firstIntersectionsWithinMargin(ray, margin));
      res.push(...this.child2!.firstIntersectionsWithinMargin(ray, margin));
    }
    res.sort((a: Intersection, b: Intersection) => {
      return a.time - b.time;
    })
    console.log(...res);
    return res;
  }

  public firstPositiveIntersection(ray: Ray): Intersection | null {

    if (ray.intersectBoundingBox(this.boundingBox) === null) return null;

    if (this.isLeaf()) {
      var res: Intersection | null = null;
      this.geometry!.forEach((geo: Geometry) => {
        var t: Intersection | null = geo.intersect(ray);
        if (t !== null && t.time > 0) {
          if (res === null) res = t;
          else res = res.time < t.time ? res : t;
        }
      });
      return res;
    } else {
      const t1 = this.child1!.firstPositiveIntersection(ray);
      const t2 = this.child2!.firstPositiveIntersection(ray);
      if (t1 === null) return t2;
      if (t2 === null) return t1;
      return t1.time < t2.time ? t1 : t2;
    }

  }

  public print(): void {
    let str: string = "";
    for (let i = 0; i < this.depth; i++) str += "->";
    if (this.geometry) str += `${this.geometry.length}geometry`;
    else str += "node";
    console.log(str);
    this.child1?.print();
    this.child2?.print();
  }

  public add(geo: Geometry): void {
    if (this.isLeaf()) {
      if (this.geometry!.length < SceneBoundingBoxHeirarchy.MAX_GEOMETRY_PER_LEAF) {
        // leaf node with space
        this.geometry!.push(geo);
      } else {
        this.geometry!.push(geo);
        this.setup(this.geometry!, this.depth);
      }
    } else {
      // non leaf node
      const nodeCenter: number = this.boundingBox.getCenter()[this.axis];
      const geoCenter: number = geo.getBoundingBox().getCenter()[this.axis];
      if (geoCenter < nodeCenter) {
        this.child1!.add(geo);
      } else {
        this.child2!.add(geo);
      }
    }
    this.boundingBox.addBoundingBox(geo.getBoundingBox());
  }

  public getDepth(): number {
    return this.depth;
  }

  public getChild1(): BBHNode | null {
    return this.child1;
  }

  public getChild2(): BBHNode | null {
    return this.child2;
  }

  public isLeaf(): boolean {
    return this.geometry != null;
  }
}

export class SceneBoundingBoxHeirarchy {

  public static readonly MAX_GEOMETRY_PER_LEAF = 5;

  private root: BBHNode;

  constructor(geometry: Geometry[]) {
    this.root = new BBHNode(geometry, 0);
  }

  public add(geo: Geometry): void {
    this.root.add(geo);
  }

  public getRoot(): BBHNode {
    return this.root;
  }

  public firstPositiveIntersection(ray: Ray): Intersection | null {
    return this.root.firstPositiveIntersection(ray);
  }

  // margin is max percentage of distance from camera behind first intersection
  public firstIntersectionsWithinMargin(ray: Ray, margin: number): Intersection[] {
    return this.root.firstIntersectionsWithinMargin(ray, margin);
  }

  public getPartiallyWithinFrustum(frustum: Frustum): [] {
    throw new Error("not implemented");
  }

  public getFullyWithinFrustum(frustum: Frustum): ObjectID[] {
    throw new Error("not implemented");
  }


  public print(): void {
    console.log("==========Scene-BBH===========");
    this.root.print();
  }

}
