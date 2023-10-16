import { Lines } from "./lines"

export class ConstructionPlane {

    private majorLines: Lines;
    private minorLines: Lines;

    constructor(device: GPUDevice, majorCount: number = 10, minorCount: number = 5, cellSize: number = 1) {

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

        this.majorLines = new Lines(device, new Float32Array(majorVerts), new Int32Array(majorIndices), new Float32Array([1.0, 1.0, 1.0, 1.0]));
        this.minorLines = new Lines(device, new Float32Array(minorVerts), new Int32Array(minorIndices), new Float32Array([0.0, 0.0, 0.0, 1.0]));

    }

    public getMajorLines(): Lines {
        return this.majorLines;
    }

    public getMinorLines(): Lines {
        return this.minorLines;
    }
}
