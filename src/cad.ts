import { Renderer } from "./render/renderer"
import { Scene } from "./scene/scene";
import { Timer } from "./utils/timer"
import { RenderStats } from "./stats"
import { EventManager } from "./events/eventManager"
import { OperatingMode } from "./mode"
import { CLI } from "./commands/cli"
import { Log } from "./log";
import { CommandManager } from "./commands/commandManager";
import { WindowManager } from "./window/windowManager";
import { SettingsManager } from "./settings/settingsManager";
import { MaterialManager } from "./materials/materialManager";
import { Selector } from "./commands/selector";

import { addTestSceneLine } from "./tests/testSceneLine";
import { addTestSceneComplex } from "./tests/testSceneComplex";
import { addTestSceneCurve } from "./tests/testSceneCurve"
import { addTestSceneArc } from "./tests/testSceneArc";
import { Mover } from "./widgets/mover";
import { addTestSceneRevolve } from "./tests/testSceneRevolve";
import { EventQueue } from "./events/eventQueue";

/*
  * Browser Based NURBS Modeling Software
  * Inspired by Rhino, Vim, CSS
  *
  * By Nick Drian
  *
*/

class CAD {

  private eventQueue!: EventQueue;
  private renderer!: Renderer;
  private scene!: Scene;
  private eventManager!: EventManager;
  private commandManager!: CommandManager;
  private windowManager!: WindowManager;
  private settingsManager!: SettingsManager;
  private materialManager!: MaterialManager;
  private selector!: Selector;
  private mover!: Mover;

  private renderStats!: RenderStats;
  private operatingMode!: OperatingMode;
  private cli!: CLI;
  private log!: Log

  public async init() {

    this.eventQueue = new EventQueue();
    this.settingsManager = new SettingsManager();
    this.commandManager = new CommandManager();
    this.cli = new CLI();

    this.setMode(OperatingMode.Command);

    this.renderer = new Renderer();
    await this.renderer.init();

    this.materialManager = new MaterialManager();

    this.scene = new Scene();
    this.scene.init();

    this.eventManager = new EventManager();
    this.log = new Log();

    this.renderStats = new RenderStats();
    this.windowManager = new WindowManager();
    this.selector = new Selector();
    this.mover = new Mover();

    addTestSceneComplex();
    // addTestSceneRevolve();
    // addTestSceneLine();
    //    addTestSceneCurve();
    //    addTestSceneArc();

  }

  public async run() {

    while (true) {

      if (document.hasFocus()) {

        var frameTimer = new Timer();

        // update scene
        var sceneTimer = new Timer();
        this.scene.tick();
        this.mover.tick();
        this.renderStats.setSceneTime(sceneTimer.getTime());

        // render
        var renderTimer = new Timer();
        await this.renderer.render(this.scene);
        this.renderStats.setRenderTime(renderTimer.getTime());

        //stats
        this.renderStats.setFrameTime(frameTimer.getTime());

        // windows
        this.windowManager.tick();

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
      this.cli.show();
    } else {
      this.cli.hide();
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

  public getLog(): Log {
    return this.log;
  }

  public getCommandManager(): CommandManager {
    return this.commandManager;
  }

  public getWindowManager(): WindowManager {
    return this.windowManager;
  }

  public getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }

  public getMaterialManager(): MaterialManager {
    return this.materialManager;
  }

  public getEventManager(): EventManager {
    return this.eventManager;
  }

  public getSelector(): Selector {
    return this.selector;
  }

  public getMover(): Mover {
    return this.mover;
  }

  public getEventQueue(): EventQueue {
    return this.eventQueue;
  }

}

export const INSTANCE = new CAD();




