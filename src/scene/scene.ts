import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import { RenderMesh } from "../render/renderMesh"
import { RenderLines } from "../render/renderLines"
import { ConstructionPlane } from "./constructionPlane"

export type uuid = number;

export class Scene {

	private camera: Camera;
    private constructionPlane!: ConstructionPlane;
    private lines: Map<uuid, RenderLines> = new Map<uuid, RenderLines>();
    private meshes: Map<uuid, RenderMesh> = new Map<uuid, RenderMesh>();
    private uuidGenerator: number = 1;

	constructor(
	) {

		this.camera = new Camera(
			vec3.create(0.0, -20.0, 10.0),	//position
			vec3.create(0.0, 0.0, 1.0),	//up
			vec3.create(0.0, 1.0, 0.0),	//forward
			1.5,		//fovy
			<HTMLCanvasElement>document.getElementById("screen")
		);

	}

    public getConstructionPlane(): ConstructionPlane {
        return this.constructionPlane;
    }

	public async init(): Promise<void> {

        this.constructionPlane = new ConstructionPlane();
	}

    public addMesh(mesh: RenderMesh): uuid {
        this.meshes.set(this.uuidGenerator, mesh);
        return this.uuidGenerator++;
    }

    public addLines(lines: RenderLines): uuid {
        this.lines.set(this.uuidGenerator, lines);
        return this.uuidGenerator++;
    }

    public getLines(id: uuid): RenderLines {
        return <RenderLines> this.lines.get(id);
    }
    public getMesh(id: uuid): RenderMesh {
        return <RenderMesh> this.meshes.get(id);
    }

    public getAllLines(): IterableIterator<RenderLines> {
        return this.lines.values();
    }

    public getAllMeshes(): IterableIterator<RenderMesh> {
        return this.meshes.values();
    }

    public removeMesh(id: uuid) {
        this.meshes.delete(id);
    }
    public removeLines(id: uuid) {
        this.lines.delete(id);
    }

	public tick(): void {

		this.camera.tick();
        for (const line of this.lines.values()) {
            line.update();
        }
        for (const mesh of this.meshes.values()) {
            mesh.update();
        }

	}

	public getCamera(): Camera {
		return this.camera;
	}

};
