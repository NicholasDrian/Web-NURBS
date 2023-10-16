import { Lines } from "../render/renderLines"

export class ConstructionPlane {

    private majorLines: Lines;
    private minorLines: Lines;

    constructor(device: GPUDevice,  majorCount: number = 10, minorCount: number = 10, cellSize: number = 1) {

        const cellCount = majorCount * minorCount;
        const size = cellCount * cellSize;

        const majorVerts: number[] = [];
        const minorVerts: number[] = [];
        const majorIndices: number[] = [];
        const minorIndices: number[] = [];

        var majorIndex: number = 0;
        var minorIndex: number = 0;

        const halfSize = size / 2.0;
        const start: number = -halfSize;

        for (var i = 0; i <= cellCount; i++) {
            const pos = start + cellSize * i;
            if (i % minorCount === 0) { // major line

                majorVerts.push(
                    start + i * cellSize, -halfSize, 0, 1,
                    start + i * cellSize, halfSize, 0, 1,
                    -halfSize, start + i * cellSize, 0, 1,
                    halfSize, start + i * cellSize, 0, 1,
                );

                majorIndices.push(majorIndex, majorIndex + 1, majorIndex + 2, majorIndex + 3);
                majorIndex += 4;
            } else { // minor line

                minorVerts.push(
                    start + i * cellSize, -halfSize, 0, 1,
                    start + i * cellSize, halfSize, 0, 1,
                    -halfSize, start + i * cellSize, 0, 1,
                    halfSize, start + i * cellSize, 0, 1,
                );

                minorIndices.push(minorIndex, minorIndex + 1, minorIndex + 2, minorIndex + 3);
                minorIndex += 4;
            }
        }

        this.majorLines = new Lines(device, new Float32Array(majorVerts), new Int32Array(majorIndices), new Float32Array([1.0, 0.8, 0.8, 1.0]));
        this.minorLines = new Lines(device, new Float32Array(minorVerts), new Int32Array(minorIndices), new Float32Array([0.6, 0.4, 0.4, 1.0]));

    }

    public setMajorColor(color: [number, number, number, number]) {
        this.majorLines.setColor(color);
    }
    public setMinorColor(color: [number, number, number, number]) {
        this.minorLines.setColor(color);
    }

    public getMajorLines(): Lines {
        return this.majorLines;
    }

    public getMinorLines(): Lines {
        return this.minorLines;
    }
}
