import { Renderer } from "./renderer"
import { Scene } from "./scene";


const init = async function() {


	const renderer : Renderer = new Renderer();
	await renderer.init();

	const scene: Scene = new Scene(renderer.getDevice());
	await scene.init();

	while (true) {

		scene.tick();
		await renderer.render(scene);
	}
}

init();
















