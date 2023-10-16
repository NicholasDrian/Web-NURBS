import { Renderer } from "./renderer"
import { Scene } from "./scene";
import { Timer } from "./timer"
import { renderStats } from "./stats"


const init = async function() {


	const renderer : Renderer = new Renderer();
	await renderer.init();

	const scene: Scene = new Scene(renderer.getDevice());
	await scene.init();

	while (true) {

        var frameTimer = new Timer();

        var sceneTimer = new Timer();
		scene.tick();
        renderStats.setSceneTime(sceneTimer.getTime());


        var renderTimer = new Timer();
		await renderer.render(scene);
        renderStats.setRenderTime(renderTimer.getTime());

        renderStats.setFrameTime(frameTimer.getTime());

        renderStats.render();
    }
}

init();
















