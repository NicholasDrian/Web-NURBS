import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import { RenderMesh } from "../render/renderMesh"
import { RenderLines } from "../render/renderLines"
import { ConstructionPlane } from "./constructionPlane"
import { RenderPoints } from "../render/renderPoints"

export type uuid = number;

export class Scene {

  private camera: Camera;
  private constructionPlane!: ConstructionPlane;
  private renderLines: Map<uuid, RenderLines> = new Map<uuid, RenderLines>();
  private renderMeshes: Map<uuid, RenderMesh> = new Map<uuid, RenderMesh>();
  private renderPoints: Map<uuid, RenderPoints> = new Map<uuid, RenderPoints>();
  private uuidGenerator: number = 1;

  constructor(
  ) {

    this.camera = new Camera(
      vec3.create(0.0, -20.0, 10.0),	//position
      vec3.create(0.0, 0.0, 1.0),	//up
      vec3.create(0.0, 1.0, 0.0),	//forward
      1.5,		//fovy
      <HTMLCanvasElement>document.getElementById("screen")
    );

  }

  public getConstructionPlane(): ConstructionPlane {
    return this.constructionPlane;
  }

  public async init(): Promise<void> {

    this.constructionPlane = new ConstructionPlane();
  }

  public addMesh(mesh: RenderMesh): uuid {
    this.renderMeshes.set(this.uuidGenerator, mesh);
    return this.uuidGenerator++;
  }

  public addLines(lines: RenderLines): uuid {
    this.renderLines.set(this.uuidGenerator, lines);
    return this.uuidGenerator++;
  }

  public addPoints(points: RenderPoints): uuid {
    this.renderPoints.set(this.uuidGenerator, points);
    return this.uuidGenerator++;
  }

  public getLines(id: uuid): RenderLines {
    return <RenderLines>this.renderLines.get(id);
  }
  public getMesh(id: uuid): RenderMesh {
    return <RenderMesh>this.renderMeshes.get(id);
  }
  public getPoints(id: uuid): RenderPoints {
    return <RenderPoints>this.renderPoints.get(id);
  }

  public getAllLines(): IterableIterator<RenderLines> {
    return this.renderLines.values();
  }
  public getAllMeshes(): IterableIterator<RenderMesh> {
    return this.renderMeshes.values();
  }
  public getAllPoints(): IterableIterator<RenderPoints> {
    return this.renderPoints.values();
  }

  public removeMesh(id: uuid) {
    this.renderMeshes.delete(id);
  }
  public removeLines(id: uuid) {
    this.renderLines.delete(id);
  }

  public tick(): void {

    this.camera.tick();
    for (const line of this.renderLines.values()) {
      line.update();
    }
    for (const mesh of this.renderMeshes.values()) {
      mesh.update();
    }

  }

  public getCamera(): Camera {
    return this.camera;
  }

};
