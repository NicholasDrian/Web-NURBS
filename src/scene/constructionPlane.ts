import { Lines } from "../render/renderLines"

export class ConstructionPlane {

    private majorLines!: Lines;
    private minorLines!: Lines;

    constructor(private device: GPUDevice,
                private majorCount: number = 10,
                private minorCount: number = 10,
                private cellSize: number = 1) {

        this.setup();
    }

    private setup() {

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

        for (var i = 0; i <= cellCount; i++) {
            if (i % this.minorCount === 0) { // major line
                majorVerts.push(
                    start + i * this.cellSize, -halfSize, 0, 1,
                    start + i * this.cellSize, halfSize, 0, 1,
                    -halfSize, start + i * this.cellSize, 0, 1,
                    halfSize, start + i * this.cellSize, 0, 1,
                );
                majorIndices.push(majorIndex, majorIndex + 1, majorIndex + 2, majorIndex + 3);
                majorIndex += 4;
            } else { // minor line
                minorVerts.push(
                    start + i * this.cellSize, -halfSize, 0, 1,
                    start + i * this.cellSize, halfSize, 0, 1,
                    -halfSize, start + i * this.cellSize, 0, 1,
                    halfSize, start + i * this.cellSize, 0, 1,
                );
                minorIndices.push(minorIndex, minorIndex + 1, minorIndex + 2, minorIndex + 3);
                minorIndex += 4;
            }
        }
        // TODO: colors based on dark mode
        this.majorLines = new Lines(this.device, new Float32Array(majorVerts), new Int32Array(majorIndices), new Float32Array([1.0, 0.9, 0.9, 1.0]));
        this.minorLines = new Lines(this.device, new Float32Array(minorVerts), new Int32Array(minorIndices), new Float32Array([0.5, 0.4, 0.4, 1.0]));
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

    public getMajorLines(): Lines {
        return this.majorLines;
    }

    public getMinorLines(): Lines {
        return this.minorLines;
    }

    public setMajorColor(color: [number, number, number, number]) {
        this.majorLines.setColor(color);
    }
    public setMinorColor(color: [number, number, number, number]) {
        this.minorLines.setColor(color);
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
