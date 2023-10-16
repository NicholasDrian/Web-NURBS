import { Renderer } from "./render/renderer"
import { Scene } from "./scene/scene";
import { Timer } from "./utils/timer"
import { RenderStats } from "./stats"
import { EventManager } from "./events/eventManager"
import { OperatingMode } from "./mode"
import { CLI } from "./cli"

class CAD {

    private renderer!: Renderer;
    private scene!: Scene;
    private eventManager!: EventManager;
    private renderStats!: RenderStats;
    private operatingMode!: OperatingMode;
    private cli: CLI;

    constructor() {

        this.cli = new CLI();

        this.setMode(OperatingMode.Navigation);

    }

    public async init() {


        this.renderer = new Renderer();
        await this.renderer.init();

        this.scene = new Scene(this.renderer.getDevice());
        await this.scene.init();

        this.eventManager = new EventManager();

        this.renderStats = new RenderStats();

    }

    public async run() {

        while (true) {

            if (document.hasFocus()) {

                var frameTimer = new Timer();

                // update scene
                var sceneTimer = new Timer();
                this.scene.tick();
                this.renderStats.setSceneTime(sceneTimer.getTime());

                // render
                var renderTimer = new Timer();
                await this.renderer.render(this.scene);
                this.renderStats.setRenderTime(renderTimer.getTime());

                this.renderStats.setFrameTime(frameTimer.getTime());

                this.renderStats.render();

            } else {

                await new Promise(r => setTimeout(r, 100));

            }
        }

    }

    public getMode(): OperatingMode {
        return this.operatingMode;
    }

    public setMode(operatingMode: OperatingMode): void {
        this.operatingMode = operatingMode;

        if (this.operatingMode == OperatingMode.Command) {
            this.cli.hide();
        } else {
            this.cli.show();
        }
    }

    public getCli(): CLI {
        return this.cli;
    }

    public getStats(): RenderStats {
        return this.renderStats;
    }

    public getScene(): Scene {
        return this.scene;
    }

    public getRenderer(): Renderer {
        return this.renderer;
    }

}

export const INSTANCE = new CAD();




