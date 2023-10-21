import { Camera } from "./camera"
import { vec3 } from "wgpu-matrix"
import { Mesh } from "../render/renderMesh"
import { Lines } from "../render/renderLines"
import { ConstructionPlane } from "./constructionPlane"
import { INSTANCE } from "../cad"

export type uuid = number;

export class Scene {

	private camera: Camera;
    private constructionPlane!: ConstructionPlane;
    private lines: Map<uuid, Lines> = new Map<uuid, Lines>();
    private meshes: Map<uuid, Mesh> = new Map<uuid, Mesh>();
    private uuidGenerator: number = 1;

	constructor(
	) {

		this.camera = new Camera(
			vec3.create(0.0, -20.0, 10.0),	//position
			vec3.create(0.0, 0.0, 1.0),	//up
			vec3.create(0.0, 1.0, 0.0),	//forward
			2,		//fovy
			<HTMLCanvasElement>document.getElementById("screen")
		);

	}

    public getConstructionPlane(): ConstructionPlane {
        return this.constructionPlane;
    }

	public async init(): Promise<void> {

        this.constructionPlane = new ConstructionPlane(INSTANCE.getRenderer().getDevice());
	}

    public addMesh(mesh: Mesh): uuid {
        this.meshes.set(this.uuidGenerator, mesh);
        return this.uuidGenerator++;
    }

    public addLines(lines: Lines): uuid {
        this.lines.set(this.uuidGenerator, lines);
        return this.uuidGenerator++;
    }

    public getLines(id: uuid): Lines {
        return <Lines> this.lines.get(id);
    }
    public getMesh(id: uuid): Mesh {
        return <Mesh> this.meshes.get(id);
    }

    public getAllLines(): IterableIterator<Lines> {
        return this.lines.values();
    }

    public getAllMeshes(): IterableIterator<Mesh> {
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
        for (const [uuid, line] of this.lines.entries()) {
            line.update();
        }
        for (const [uuid, mesh] of this.meshes.entries()) {
            mesh.update();
        }

	}

	public getCamera(): Camera {
		return this.camera;
	}

};
