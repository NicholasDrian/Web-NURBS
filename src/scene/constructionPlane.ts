import { Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { RenderLines } from "../render/renderLines"
import { RenderID } from "./scene";

// TODO: draw this first, disable depth buffer while drawing
export class ConstructionPlane {

  private majorLines: RenderID;
  private minorLines: RenderID;

  constructor(private majorCount: number = 10,
    private minorCount: number = 10,
    private cellSize: number = 1) {
    this.majorLines = 0;
    this.minorLines = 0;
    this.setup();
  }

  private setup() {

    if (this.majorLines) INSTANCE.getScene().removeLines(this.majorLines);
    if (this.minorLines) INSTANCE.getScene().removeLines(this.minorLines);

    const cellCount = this.majorCount * this.minorCount;
    const size = cellCount * this.cellSize;

    const majorVerts: number[] = [];
    const minorVerts: number[] = [];
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
          start + i * this.cellSize, -halfSize, z, 1,
          start + i * this.cellSize, halfSize, z, 1,
          -halfSize, start + i * this.cellSize, z, 1,
          halfSize, start + i * this.cellSize, z, 1,
        );
        majorIndices.push(majorIndex, majorIndex + 1, majorIndex + 2, majorIndex + 3);
        majorIndex += 4;
      } else { // minor line
        minorVerts.push(
          start + i * this.cellSize, -halfSize, z, 1,
          start + i * this.cellSize, halfSize, z, 1,
          -halfSize, start + i * this.cellSize, z, 1,
          halfSize, start + i * this.cellSize, z, 1,
        );
        minorIndices.push(minorIndex, minorIndex + 1, minorIndex + 2, minorIndex + 3);
        minorIndex += 4;
      }
    }
    // TODO: colors based on dark mode
    this.majorLines = INSTANCE.getScene().addRenderLines(new RenderLines(new Float32Array(majorVerts), new Int32Array(majorIndices), [1.0, 0.9, 0.9, 1.0]));
    this.minorLines = INSTANCE.getScene().addRenderLines(new RenderLines(new Float32Array(minorVerts), new Int32Array(minorIndices), [0.5, 0.4, 0.4, 1.0]));
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

  public getMajorLines(): RenderID {
    return this.majorLines;
  }

  public getMinorLines(): RenderID {
    return this.minorLines;
  }

  public setMajorColor(color: [number, number, number, number]) {
    INSTANCE.getScene().getLines(this.majorLines).setColor(color);
  }
  public setMinorColor(color: [number, number, number, number]) {
    INSTANCE.getScene().getLines(this.minorLines).setColor(color);
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
