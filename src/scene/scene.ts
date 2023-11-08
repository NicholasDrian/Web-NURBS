import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import { RenderMesh } from "../render/renderMesh"
import { RenderLines } from "../render/renderLines"
import { ConstructionPlane } from "./constructionPlane"
import { RenderPoints } from "../render/renderPoints"
import { SceneBoundingBoxHeirarchy } from "../geometry/sceneBoundingBoxHeirarcy"
import { Geometry } from "../geometry/geometry"
import { RenderMeshInstanced } from "../render/renterMeshInstanced"

export type RenderID = number; // for gpu objects
export type ObjectID = number; // for cpu objects

export class Scene {

  private camera: Camera;
  private constructionPlane!: ConstructionPlane;

  private renderLines: Map<RenderID, RenderLines> = new Map<RenderID, RenderLines>();
  private renderMeshes: Map<RenderID, RenderMesh> = new Map<RenderID, RenderMesh>();
  private renderPoints: Map<RenderID, RenderPoints> = new Map<RenderID, RenderPoints>();
  private renderMeshesInstanced: Map<RenderID, RenderMeshInstanced> = new Map<RenderID, RenderMeshInstanced>();

  private rootGeometry: Map<ObjectID, Geometry> = new Map<ObjectID, Geometry>(); // stores geometry with no parents
  private geometry: Map<ObjectID, Geometry> = new Map<ObjectID, Geometry>(); // stores all geometry

  private renderIDGenerator: RenderID = 1;
  private objectIDGenerator: ObjectID = 1;
  private boundingBoxHeirarchy: SceneBoundingBoxHeirarchy = new SceneBoundingBoxHeirarchy([]);

  constructor(
  ) {

    this.camera = new Camera(
      vec3.create(0.0, -80.0, 20.0),	//position
      vec3.create(0.0, 0.0, 1.0),	//up
      vec3.create(0.0, 1.0, 0.0),	//forward
      1,		//fovy
      <HTMLCanvasElement>document.getElementById("screen")
    );

  }

  getRootGeometry(): IterableIterator<Geometry> {
    return this.rootGeometry.values()
  }

  public getConstructionPlane(): ConstructionPlane {
    return this.constructionPlane;
  }

  public getBoundingBoxHeirarchy(): SceneBoundingBoxHeirarchy {
    return this.boundingBoxHeirarchy;
  }

  public init(): void {
    this.constructionPlane = new ConstructionPlane();
  }

  public generateNewObjectID(geo: Geometry): ObjectID {
    this.geometry.set(this.objectIDGenerator, geo);
    return this.objectIDGenerator++;
  }

  public addGeometry(geo: Geometry): void {
    this.boundingBoxHeirarchy.add(geo);
    this.rootGeometry.set(geo.getID(), geo);
  }

  public getGeometry(id: ObjectID): Geometry {
    return this.geometry.get(id)!;
  }

  public generateNewRenderID(): RenderID {
    return this.renderIDGenerator++;
  }

  public addRenderMesh(mesh: RenderMesh): void {
    this.renderMeshes.set(mesh.getID(), mesh);
  }
  public addRenderMeshInstanced(mesh: RenderMeshInstanced): void {
    this.renderMeshesInstanced.set(mesh.getID(), mesh);
  }
  public addRenderLines(lines: RenderLines): void {
    this.renderLines.set(lines.getID(), lines);
  }
  public addRenderPoints(points: RenderPoints): void {
    this.renderPoints.set(points.getID(), points);
  }

  public getLines(id: RenderID): RenderLines {
    return <RenderLines>this.renderLines.get(id);
  }
  public getMesh(id: RenderID): RenderMesh {
    return <RenderMesh>this.renderMeshes.get(id);
  }
  public getPoints(id: RenderID): RenderPoints {
    return <RenderPoints>this.renderPoints.get(id);
  }
  public getMeshInstanced(id: RenderID): RenderMeshInstanced {
    return <RenderMeshInstanced>this.renderMeshes.get(id);
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
  public getAllMeshesInstanced(): IterableIterator<RenderMeshInstanced> {
    return this.renderMeshesInstanced.values();
  }

  public removeMesh(id: RenderID): void {
    this.renderMeshes.delete(id);
  }
  public removeLines(id: RenderID): void {
    this.renderLines.delete(id);
  }
  public removePoints(id: RenderID): void {
    this.renderPoints.delete(id);
  }
  public removeMeshInstanced(id: RenderID): void {
    this.renderMeshesInstanced.delete(id);
  }

  public tick(): void {

    this.camera.tick();
    for (const line of this.renderLines.values()) {
      line.update();
    }
    for (const mesh of this.renderMeshes.values()) {
      mesh.update();
    }
    for (const point of this.renderPoints.values()) {
      point.update();
    }
    for (const mesh of this.renderMeshesInstanced.values()) {
      mesh.update();
    }

  }

  public getCamera(): Camera {
    return this.camera;
  }

};
