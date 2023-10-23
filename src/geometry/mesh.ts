import { vec3, Vec3 } from "wgpu-matrix";
import { RenderMesh } from "../render/renderMesh";



export class Mesh {

  private verts: Vertex[];
  private faces: Face[];
  private edges: Edge[];
  private renderMesh!: RenderMesh;

  constructor(verts: Vec3[], indices: number[]) {
    // TODO: implement
    this.verts = [];
    this.faces = [];
    this.edges = [];
  }
}

class Vertex {
  private faces: Face[] = [];
  private edges: Edge[] = [];
  private normal: Vec3 | null = null;
}

class Face {
  private neighbors: Face[] = [];
  private verts: Vertex[] = [];
  private normal: Vec3 | null = null;
}

class Edge {
  private faces: Face[] = [];
  constructor(
    private vert1: Vertex,
    private vert2: Vertex
  ) {

  }
}

