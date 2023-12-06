import { INSTANCE } from "../cad";
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
      var child1Geometry: Geometry[] = [];
      var child2Geometry: Geometry[] = [];
      geometry.forEach((geo: Geometry) => {
        if (geo.getBoundingBox().getCenter()[this.axis] < center) {
          child1Geometry.push(geo);
        } else {
          child2Geometry.push(geo);
        }
      });
      if (child1Geometry.length === 0 || child2Geometry.length === 0) {
        child1Geometry = geometry.slice(0, geometry.length / 2);
        child2Geometry = geometry.slice(geometry.length / 2, geometry.length);
      }
      this.child1 = new BBHNode(child1Geometry, depth + 1);
      this.child2 = new BBHNode(child2Geometry, depth + 1);
    }
  }

  public firstIntersectionsWithinMargin(ray: Ray, margin: number, sub: boolean): Intersection[] {
    const intersections: Intersection[] = [];
    if (ray.almostIntersectBoundingBox(this.boundingBox, 10) === null) return intersections;

    if (this.isLeaf()) {
      this.geometry!.forEach((geo: Geometry) => {
        const intersection: Intersection | null = geo.intersect(ray, sub);
        if (intersection !== null) intersections.push(intersection);
      });
    } else {
      intersections.push(...this.child1!.firstIntersectionsWithinMargin(ray, margin, sub));
      intersections.push(...this.child2!.firstIntersectionsWithinMargin(ray, margin, sub));
    }
    intersections.sort((a: Intersection, b: Intersection) => {
      // TODO: think about this
      return a.time - b.time;
    })
    const nearIntersections: Intersection[] = [];
    for (const intersection of intersections) {
      if (intersection.time <= intersections[0].time * (1 + margin / 100)) {
        nearIntersections.push(intersection);
      }
    }
    return nearIntersections;
  }

  public getAllGeometry(): Geometry[] {
    if (this.isLeaf()) return this.geometry!;
    return [...this.child1!.getAllGeometry(), ...this.child2!.getAllGeometry()];
  }

  public getWithinFrustum(frustum: Frustum, inclusive: boolean): Geometry[] {
    if (frustum.containsBoundingBoxFully(this.boundingBox)) {
      return this.getAllGeometry();
    }
    if (!frustum.intersectsBoundingBox(this.boundingBox)) {
      return [];
    }
    if (this.isLeaf()) {
      const res: Geometry[] = [];
      for (const geo of this.geometry!) {
        if (geo.isWithinFrustum(frustum, inclusive)) {
          res.push(geo);
        }
      }
      return res;
    } else {
      return [
        ...this.child1!.getWithinFrustum(frustum, inclusive),
        ...this.child2!.getWithinFrustum(frustum, inclusive)
      ]
    }
  }

  public getWithinFrustumSub(frustum: Frustum, inclusive: boolean): [Geometry[], number[][]] {
    if (frustum.containsBoundingBoxFully(this.boundingBox)) {
      const geos: Geometry[] = this.getAllGeometry();
      const subs: number[][] = [];
      for (let i = 0; i < geos.length; i++) subs.push([-1]);
      return [geos, subs];
    }
    if (!frustum.intersectsBoundingBox(this.boundingBox)) {
      return [[], []];
    }
    if (this.isLeaf()) {
      const res: [Geometry[], number[][]] = [[], []];
      for (const geo of this.geometry!) {
        const sub: number[] = geo.getWithinFrustumSub(frustum, inclusive);
        if (sub.length > 0) {
          res[0].push(geo);
          res[1].push(sub);
        }
      }
      return res;
    } else {
      const res1: [Geometry[], number[][]] = this.child1!.getWithinFrustumSub(frustum, inclusive);
      const res2: [Geometry[], number[][]] = this.child2!.getWithinFrustumSub(frustum, inclusive);
      res1[0].push(...res2[0]);
      res1[1].push(...res2[1]);
      return res1;
    }
  }

  public firstPositiveIntersection(ray: Ray, sub: boolean): Intersection | null {

    if (ray.almostIntersectBoundingBox(this.boundingBox, 10) === null) return null;

    if (this.isLeaf()) {
      var res: Intersection | null = null;
      this.geometry!.forEach((geo: Geometry) => {
        var t: Intersection | null = geo.intersect(ray, sub);
        if (t !== null && t.time > 0) {
          if (res === null) res = t;
          else res = res.time < t.time ? res : t;
        }
      });
      return res;
    } else {
      const t1 = this.child1!.firstPositiveIntersection(ray, sub);
      const t2 = this.child2!.firstPositiveIntersection(ray, sub);
      if (t1 === null) return t2;
      if (t2 === null) return t1;
      return t1.time < t2.time ? t1 : t2;
    }

  }

  public print(): void {
    let str: string = "";
    for (let i = 0; i < this.depth; i++) str += "->";
    if (this.geometry) {
      for (const geo of this.geometry) {
        str += `[${geo.getID()},${geo.getTypeName()}]`;
      }
    }
    else str += "node";
    console.log(str);
    this.child1?.print();
    this.child2?.print();
  }

  public remove(geo: Geometry): void {
    // TODO: after a few removals, should rebalance / shrink

    if (!this.boundingBox.contains(geo.getBoundingBox())) return;

    if (this.isLeaf()) {
      for (let i = 0; i < this.geometry!.length; i++) {
        if (this.geometry![i] === geo) {
          this.geometry!.splice(i, 1);
        }
      }
    } else {
      this.child1!.remove(geo);
      this.child2!.remove(geo);
    }
  }

  public tighten(): void {
    // tighten up bbs after removals
    throw new Error("not implemented");
  }

  public add(geo: Geometry): void {
    this.boundingBox.addBoundingBox(geo.getBoundingBox());
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

  public remove(geo: Geometry): void {
    this.root.remove(geo);
  }

  public getRoot(): BBHNode {
    return this.root;
  }

  public firstPositiveIntersection(ray: Ray, sub: boolean): Intersection | null {
    const sceneIntersection: Intersection | null = this.root.firstPositiveIntersection(ray, sub);
    if (sceneIntersection) return sceneIntersection;
    return INSTANCE.getScene().getConstructionPlane().intersect(ray);
  }

  // margin is max percentage of distance from camera behind first intersection
  public firstIntersectionsWithinMargin(ray: Ray, margin: number, sub: boolean): Intersection[] {
    const res: Intersection[] = this.root.firstIntersectionsWithinMargin(ray, margin, sub);
    const iGroundPlane: Intersection | null = INSTANCE.getScene().getConstructionPlane().intersect(ray);
    if (res.length === 0) return iGroundPlane ? [iGroundPlane] : [];
    if (iGroundPlane && iGroundPlane.time < res[0].time * (1 + (margin / 100))) {
      res.push(iGroundPlane);
    }
    return res;
  }

  public getWithinFrustum(frustum: Frustum, inclusive: boolean): Geometry[] {
    return this.root.getWithinFrustum(frustum, inclusive);
  }

  public getWithinFrustumSub(frustum: Frustum, inclusive: boolean): [Geometry[], number[][]] {
    return this.root.getWithinFrustumSub(frustum, inclusive);
  }

  public print(): void {
    console.log("==========Scene-BBH===========");
    this.root.print();
  }

}
