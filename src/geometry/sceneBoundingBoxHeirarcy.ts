import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";

enum Axis {
  X = 0,
  Y = 1,
  Z = 2,
}

class BVHNode {

  private axis: Axis;
  private child1: BVHNode | null;
  private child2: BVHNode | null;
  private geometry: Geometry[] | null;
  private boundingBox: BoundingBox;

  constructor(
    geometry: Geometry[],
    private depth: number,
  ) {
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
      this.child1 = new BVHNode(child1Geometry, depth + 1);
      this.child2 = new BVHNode(child2Geometry, depth + 1);
    }
  }

  public getDepth(): number {
    return this.depth;
  }

  public getChild1(): BVHNode | null {
    return this.child1;
  }

  public getChild2(): BVHNode | null {
    return this.child2;
  }

  public isLeaf(): boolean {
    return this.geometry != null;
  }
}

export class SceneBoundingBoxHeirarchy {

  public static readonly MAX_GEOMETRY_PER_LEAF = 5;

  private root: BVHNode;

  constructor(geometry: Geometry[]) {
    this.root = new BVHNode(geometry, 0);
  }


}
