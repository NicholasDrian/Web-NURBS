import { mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Group } from "../geometry/group";
import { Intersection } from "../geometry/intersection";
import { Plane } from "../geometry/plane";
import { Ray } from "../geometry/ray";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines";


// TODO: draw this first, disable depth buffer while drawing
export class ConstructionPlane {

  private majorLines: RenderLines | null;
  private minorLines: RenderLines | null;
  private xAxis: RenderLines | null;
  private yAxis: RenderLines | null;

  private majorLinesParent: Group;
  private minorLinesParent: Group;
  private xAxisParent: Group;
  private yAxisParent: Group;

  constructor(private majorCount: number = 10,
    private minorCount: number = 10,
    private cellSize: number = 1) {
    this.majorLines = null;
    this.minorLines = null;
    this.xAxis = null;
    this.yAxis = null;
    this.minorLinesParent = new Group([], null, undefined, "mid grey");
    this.majorLinesParent = new Group([], null, undefined, "lighter grey");
    this.xAxisParent = new Group([], null, undefined, "red");
    this.yAxisParent = new Group([], null, undefined, "green");
    this.setup();
  }

  private setup() {


    const cellCount = this.majorCount * this.minorCount;
    const size = cellCount * this.cellSize;

    const majorVerts: Vec3[] = [];
    const minorVerts: Vec3[] = [];
    const majorIndices: number[] = [];
    const minorIndices: number[] = [];
    const majorSubSelection: boolean[] = [];
    const minorSubSelection: boolean[] = [];

    var majorIndex: number = 0;
    var minorIndex: number = 0;

    const halfSize = size / 2.0;
    const start: number = -halfSize;
    const z: number = -0.001;

    for (var i = 0; i <= cellCount; i++) {
      let midOrEnd: number = (i === cellCount / 2) ? 0 : halfSize;
      if (i % this.minorCount === 0) { // major line
        majorVerts.push(
          vec3.create(start + i * this.cellSize, -halfSize, z),
          vec3.create(start + i * this.cellSize, midOrEnd, z),
          vec3.create(-halfSize, start + i * this.cellSize, z),
          vec3.create(midOrEnd, start + i * this.cellSize,),
        );
        majorSubSelection.push(false, false, false, false);
        majorIndices.push(majorIndex, majorIndex + 1, majorIndex + 2, majorIndex + 3);
        majorIndex += 4;
      } else { // minor line
        minorVerts.push(
          vec3.create(start + i * this.cellSize, -halfSize, z),
          vec3.create(start + i * this.cellSize, midOrEnd, z),
          vec3.create(-halfSize, start + i * this.cellSize, z),
          vec3.create(midOrEnd, start + i * this.cellSize, z),
        );
        minorSubSelection.push(false, false, false, false);
        minorIndices.push(minorIndex, minorIndex + 1, minorIndex + 2, minorIndex + 3);
        minorIndex += 4;
      }
    }
    if (this.majorLines) INSTANCE.getScene().removeLines(this.majorLines);
    if (this.minorLines) INSTANCE.getScene().removeLines(this.minorLines);
    if (this.xAxis) INSTANCE.getScene().removeLines(this.xAxis);
    if (this.yAxis) INSTANCE.getScene().removeLines(this.yAxis);

    this.majorLines = new RenderLines(this.majorLinesParent, majorVerts, majorIndices, majorSubSelection);
    this.minorLines = new RenderLines(this.minorLinesParent, minorVerts, minorIndices, minorSubSelection);
    this.xAxis = new RenderLines(this.xAxisParent, [vec3.create(0, 0, 0), vec3.create(halfSize, 0, 0)], [0, 1], [false, false]);
    this.yAxis = new RenderLines(this.yAxisParent, [vec3.create(0, 0, 0), vec3.create(0, halfSize, 0)], [0, 1], [false, false]);

    INSTANCE.getScene().addRenderLines(this.majorLines);
    INSTANCE.getScene().addRenderLines(this.minorLines);
    INSTANCE.getScene().addRenderLines(this.xAxis);
    INSTANCE.getScene().addRenderLines(this.yAxis);
  }


  public snapToGrid(point: Vec3): Vec3 {
    const alignedWithOrigin: boolean = ((this.minorCount * this.majorCount) & 1) === 0;
    var dx: number = point[0] % this.cellSize;
    var dy: number = point[1] % this.cellSize;
    if (dx < 0) dx += this.cellSize;
    if (dy < 0) dy += this.cellSize;
    if (!alignedWithOrigin) {
      point[0] += this.cellSize / 2;
      point[1] += this.cellSize / 2;
    }
    if (dx < this.cellSize / 2) point[0] -= dx;
    else point[0] += this.cellSize - dx;
    if (dy < this.cellSize / 2) point[1] -= dy;
    else point[1] += this.cellSize - dy;

    if (!alignedWithOrigin) {
      point[0] -= this.cellSize / 2;
      point[1] -= this.cellSize / 2;
    }
    return point;
  }

  public intersect(ray: Ray): Intersection | null {
    const tGroundPlane: number | null = ray.intersectPlane(new Plane(vec3.create(0, 0, 0), vec3.create(0, 0, 1)));
    if (tGroundPlane) { // intrsected ground plane;
      var pGroundPlane: Vec3 | null = tGroundPlane ? ray.at(tGroundPlane!) : null;
      if (pGroundPlane && INSTANCE.getSettingsManager().getSnapSettingsManager().getSnapSettings().snapGrid) {
        pGroundPlane = INSTANCE.getScene().getConstructionPlane().snapToGrid(pGroundPlane);
      }
      if (pGroundPlane) {
        return new Intersection(tGroundPlane, "ground plane", null, 0, pGroundPlane, 0, 0);
      }
    }
    return null;
  }

  public getMinorCount(): number {
    return this.minorCount;
  }

  public getMajorCount(): number {
    return this.majorCount;
  }

  public getCellSize(): number {
    return this.cellSize;
  }

  public setMajorMaterial(mat: MaterialName) {
    this.majorLinesParent!.setMaterial(mat);
  }
  public setMinorMaterial(mat: MaterialName) {
    this.minorLinesParent!.setMaterial(mat);
  }

  public setMinorCount(count: number): void {
    this.minorCount = count;
    this.setup();
  }

  public setMajorCount(count: number): void {
    this.majorCount = count;
    this.setup();
  }

  public setCellSize(size: number): void {
    this.cellSize = size;
    this.setup();
  }

}
