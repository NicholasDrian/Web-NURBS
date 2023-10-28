import { mat4, vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Lines } from "../geometry/lines";
import { MaterialName } from "../materials/material";
import { RenderLines } from "../render/renderLines"
import { RenderID } from "./scene";

// TODO: draw this first, disable depth buffer while drawing
export class ConstructionPlane {

  private majorLines: Lines | null;
  private minorLines: Lines | null;

  constructor(private majorCount: number = 10,
    private minorCount: number = 10,
    private cellSize: number = 1) {
    this.majorLines = null;
    this.minorLines = null;
    this.setup();
  }

  private setup() {


    const cellCount = this.majorCount * this.minorCount;
    const size = cellCount * this.cellSize;

    const majorVerts: Vec3[] = [];
    const minorVerts: Vec3[] = [];
    const majorIndices: number[] = [];
    const minorIndices: number[] = [];

    var majorIndex: number = 0;
    var minorIndex: number = 0;

    const halfSize = size / 2.0;
    const start: number = -halfSize;
    const z: number = -0.001;

    for (var i = 0; i <= cellCount; i++) {
      if (i % this.minorCount === 0) { // major line
        majorVerts.push(
          vec3.create(start + i * this.cellSize, -halfSize, z),
          vec3.create(start + i * this.cellSize, halfSize, z),
          vec3.create(-halfSize, start + i * this.cellSize, z),
          vec3.create(halfSize, start + i * this.cellSize,),
        );
        majorIndices.push(majorIndex, majorIndex + 1, majorIndex + 2, majorIndex + 3);
        majorIndex += 4;
      } else { // minor line
        minorVerts.push(
          vec3.create(start + i * this.cellSize, -halfSize, z),
          vec3.create(start + i * this.cellSize, halfSize, z),
          vec3.create(-halfSize, start + i * this.cellSize, z),
          vec3.create(halfSize, start + i * this.cellSize, z),
        );
        minorIndices.push(minorIndex, minorIndex + 1, minorIndex + 2, minorIndex + 3);
        minorIndex += 4;
      }
    }
    if (this.majorLines) this.majorLines.delete();
    if (this.minorLines) this.minorLines.delete();
    this.majorLines = new Lines(majorVerts, majorIndices, null, mat4.identity(), "lighter grey");
    this.minorLines = new Lines(minorVerts, minorIndices, null, mat4.identity(), "light grey");
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
    this.majorLines!.setMaterial(mat);
  }
  public setMinorMaterial(mat: MaterialName) {
    this.minorLines!.setMaterial(mat);
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
