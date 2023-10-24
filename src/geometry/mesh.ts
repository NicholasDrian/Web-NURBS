import { Vec3 } from "wgpu-matrix";
import { BoundingBox } from "./boundingBox";
import { Geometry } from "./geometry";



export class Mesh extends Geometry {

  // TODO: create render resources

  constructor(
    private verts: Vertex[],
    private indices: number[],
  ) {
    super();
  }

  public getBoundingBox(): BoundingBox {
    const bb: BoundingBox = new BoundingBox();
    this.verts.forEach((vert: Vertex) => { bb.addVec3(vert.point); });
    return bb;
  }

}

class Vertex {

  constructor(
    public point: Vec3,
    public normal: Vec3
  ) {

  }

}
