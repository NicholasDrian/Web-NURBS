import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import { Mesh } from "../render/renderMesh"
import { Lines } from "../render/renderLines"
import { ConstructionPlane } from "./constructionPlane"

export class Scene {

	private camera: Camera;
    private constructionPlane: ConstructionPlane;
    private lines: Lines[] = [];
    private meshes: Mesh[] = [];

	constructor(
		private renderDevice: GPUDevice
	) {

		this.camera = new Camera(
			vec3.create(0.0, 5.0, 0.0),	//position
			vec3.create(0.0, 1.0, 0.0),	//up
			vec3.create(0.0, 0.0, 1.0),	//forward
			2,		//fovy
			<HTMLCanvasElement>document.getElementById("screen")
		);

        this.constructionPlane = new ConstructionPlane(renderDevice);
        this.lines.push(
            this.constructionPlane.getMajorLines(),
            this.constructionPlane.getMinorLines(),
        );

	}

	public async init(): Promise<void> {

	}

    public getMeshes(): Mesh[] {
        return this.meshes;
    }

    public getLines(): Lines[] {
        return this.lines;
    }

	public tick(): void {

		this.camera.tick();
        this.lines.map((lines: Lines) => { lines.update(); return lines; });
        this.meshes.map((mesh: Mesh) => { mesh.update(); return mesh; });
	}

	public getCamera(): Camera {
		return this.camera;
	}

};
