import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import { Mesh } from "./mesh"
import { Lines } from "./lines"
import { ConstructionPlane } from "./constructionPlane"

export class Scene {

	private camera: Camera;
    private constructionPlane: ConstructionPlane;

	constructor(
		private renderDevice: GPUDevice
	) {

		this.camera = new Camera(
			vec3.create(0.0, 0.0, -20.0),	//position
			vec3.create(0.0, 1.0, 0.0),	//up
			vec3.create(0.0, 0.0, 1.0),	//forward
			2,		//fovy
			<HTMLCanvasElement>document.getElementById("screen")
		);

        this.constructionPlane = new ConstructionPlane(renderDevice);

	}

	public async init(): Promise<void> {

	}

    public getMeshes(): Mesh[] {
        return [];
    }

    public getLines(): Lines[] {
       return [
            this.constructionPlane.getMajorLines(),
            this.constructionPlane.getMinorLines(),
       ];
    }


	public tick(): void {

		this.camera.tick();

	}

	public getCamera(): Camera {
		return this.camera;
	}

};
