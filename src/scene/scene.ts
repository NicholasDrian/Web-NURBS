import { Camera } from "./camera"
import { Mat4, vec3 } from "wgpu-matrix"
import { RenderMesh } from "../render/renderMesh"
import { RenderLines } from "../render/renderLines"
import { ConstructionPlane } from "./constructionPlane"
import { RenderPoints } from "../render/renderPoints"
import { SceneBoundingBoxHeirarchy } from "../geometry/sceneBoundingBoxHeirarcy"
import { Geometry } from "../geometry/geometry"
import { RenderMeshInstanced } from "../render/renterMeshInstanced"
import { INSTANCE } from "../cad"
import { RenderCurve } from "../render/renderCurve"

export class Scene {

  private camera: Camera;
  private constructionPlane!: ConstructionPlane;


  private renderLines: Set<RenderLines> = new Set<RenderLines>();
  private renderCurves: Set<RenderCurve> = new Set<RenderCurve>();
  private renderMeshes: Set<RenderMesh> = new Set<RenderMesh>();
  private renderPoints: Set<RenderPoints> = new Set<RenderPoints>();
  private renderMeshesInstanced: Set<RenderMeshInstanced> = new Set<RenderMeshInstanced>();

  private rootGeometry: Set<Geometry> = new Set<Geometry>(); // stores geometry with no parents
  private geometry: Set<Geometry> = new Set<Geometry>(); // stores all geometry

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

  public getRootGeometry(): IterableIterator<Geometry> {
    return this.rootGeometry.values()
  }

  public containsGeometry(geo: Geometry): boolean {
    return this.geometry.has(geo);
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

  public addGeometry(geo: Geometry): void {
    this.boundingBoxHeirarchy.add(geo);
    this.rootGeometry.add(geo);
  }

  public removeGeometry(geo: Geometry): void {
    this.boundingBoxHeirarchy.remove(geo);
    this.rootGeometry.delete(geo);
  }

  public addRenderMesh(mesh: RenderMesh): void { this.renderMeshes.add(mesh); }
  public addRenderMeshInstanced(mesh: RenderMeshInstanced): void { this.renderMeshesInstanced.add(mesh); }
  public addRenderLines(lines: RenderLines): void { this.renderLines.add(lines); }
  public addRenderCurve(curve: RenderCurve): void { this.renderCurves.add(curve); }
  public addRenderPoints(points: RenderPoints): void { this.renderPoints.add(points); }

  public getAllLines(): IterableIterator<RenderLines> { return this.renderLines.values(); }
  public getAllCurves(): IterableIterator<RenderCurve> { return this.renderCurves.values(); }
  public getAllMeshes(): IterableIterator<RenderMesh> { return this.renderMeshes.values(); }
  public getAllPoints(): IterableIterator<RenderPoints> { return this.renderPoints.values(); }
  public getAllMeshesInstanced(): IterableIterator<RenderMeshInstanced> { return this.renderMeshesInstanced.values(); }

  public removeMesh(renderMesh: RenderMesh): void { this.renderMeshes.delete(renderMesh); }
  public removeLines(renderLines: RenderLines): void { this.renderLines.delete(renderLines); }
  public removeCurve(renderCurve: RenderCurve): void { this.renderCurves.delete(renderCurve); }
  public removePoints(renderPoints: RenderPoints): void { this.renderPoints.delete(renderPoints); }
  public removeMeshInstanced(renderMeshInstanced: RenderMeshInstanced): void { this.renderMeshesInstanced.delete(renderMeshInstanced); }


  public deleteSelected(): void {
    for (const geo of this.rootGeometry.values()) {
      if (geo.isSelected()) {
        this.boundingBoxHeirarchy.remove(geo);
        this.rootGeometry.delete(geo);
        geo.delete();
      }
    }
    INSTANCE.getSelector().reset();
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
    for (const curve of this.renderCurves.values()) {
      curve.update();
    }

  }

  public getCamera(): Camera {
    return this.camera;
  }

};
