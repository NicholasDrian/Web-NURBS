import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";
import { InstancedMesh } from "./instancedMesh";
import { MeshBoundingBoxHeirarchy } from "./meshBoundingBoxHeirarchy";
import { Ray } from "./ray";

enum Axis {
  X = 0,
  Y = 1,
  Z = 2,
}

// shold probably transform ray

class InstancedMeshBoundingBoxHeirarchyNode {

  private instances!: number[] | null;
  private child1!: InstancedMeshBoundingBoxHeirarchyNode | null;
  private child2!: InstancedMeshBoundingBoxHeirarchyNode | null;
  private boundingBox!: BoundingBox;
  private axis!: Axis;

  constructor(
    private heirarchy: InstancedMeshBoundingBoxHeirarchy,
    instances: number[],
    boundingBoxes: BoundingBox[],
    private depth: number = 0
  ) {
    this.setup(instances, boundingBoxes);
  }

  private setup(instances: number[], boundingBoxes: BoundingBox[]): void {

    this.axis = this.depth % 3;

    this.boundingBox = new BoundingBox();
    for (let bb of boundingBoxes) {
      this.boundingBox.addBoundingBox(bb);
    }

    if (instances.length <= InstancedMeshBoundingBoxHeirarchy.MAX_INSTANCES_PER_LEAF) {
      // leaf
      this.instances = instances;
      this.child1 = null;
      this.child2 = null;
    } else {
      // non leaf
      this.instances = null;
      const child1Indices: number[] = [];
      const child2Indices: number[] = [];
      const nodeCenter = this.boundingBox.getCenter();
      for (let i = 0; i < instances.length; i++) {
        const bbCenter = boundingBoxes[i].getCenter();
        if (bbCenter[this.axis] < nodeCenter[this.axis]) {
          child1Indices.push(instances[i]);
        } else {
          child2Indices.push(instances[i]);
        }
      }
      this.child1 = new InstancedMeshBoundingBoxHeirarchyNode(this.heirarchy, child1Indices, boundingBoxes, this.depth + 1);
      this.child2 = new InstancedMeshBoundingBoxHeirarchyNode(this.heirarchy, child2Indices, boundingBoxes, this.depth + 1);
    }
  }


  public intersect(ray: Ray, verts: Vec3[]): number | null {

    if (ray.intersectBoundingBox(this.boundingBox) === null) return null;

    if (this.isLeaf()) {
      var res: number | null = null;
      for (let i of this.instances!) {
        var t: number | null = this.heirarchy.intersectInstance(ray, i);
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
    return this.instances !== null;
  }

  public print(): void {
    let str: string = "";
    for (let i = 0; i < this.depth; i++) str += "->";
    if (this.instances) str += `${this.instances.length}instances`;
    else str += "node";
    console.log(str);
    this.child1?.print();
    this.child2?.print();
  }

}

export class InstancedMeshBoundingBoxHeirarchy {

  public static readonly MAX_INSTANCES_PER_LEAF = 5;

  private root: InstancedMeshBoundingBoxHeirarchyNode;
  private meshBBH: MeshBoundingBoxHeirarchy;

  constructor(private mesh: InstancedMesh) {
    this.meshBBH = new MeshBoundingBoxHeirarchy(mesh.getVerts(), mesh.getIndices());

    const instances: number[] = [];
    const bbs: BoundingBox[] = [];
    for (let i = 0; i < mesh.getInstanceCount(); i++) {
      instances.push(i);
      bbs.push(mesh.getBoundingBoxInstance(i));
    }
    this.root = new InstancedMeshBoundingBoxHeirarchyNode(this, instances, bbs);
  }

  public print(): void {
    console.log("========Instanced-Mesh-BBH========");
    this.root.print();
  }

  public intersect(ray: Ray, verts: Vec3[]): number | null {
    return this.root.intersect(ray, verts);
  }

  public intersectInstance(ray: Ray, instance: number): number | null {
    const objectSpaceRay: Ray = Ray.transform(ray, mat4.inverse(this.mesh.getTransform(instance)));
    return this.meshBBH.intersect(objectSpaceRay, this.mesh.getVerts());
  }

}
