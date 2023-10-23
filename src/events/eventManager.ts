import { OperatingMode } from "../mode"
import { INSTANCE } from "../cad"
import { ClickHandler } from "./clickHandler";

export class EventManager {

  private clickHandler: ClickHandler;

  constructor() {

    this.clickHandler = new ClickHandler();

    onmousemove = (event: MouseEvent) => {
      INSTANCE.getCommandManager().handleMouseMove(event);
      this.clickHandler.onMouseMove(event);
    };

    onresize = () => {
      INSTANCE.getRenderer().updateScreenSize();
    }

    onkeydown = (event: KeyboardEvent) => {
      if (event.code == "Tab") {
        if (INSTANCE.getMode() == OperatingMode.Navigation) {
          INSTANCE.setMode(OperatingMode.Command);
        } else {
          INSTANCE.getCli().clearInput();
          INSTANCE.setMode(OperatingMode.Navigation);
        }
        // prevent tab from chaging focus
        event.preventDefault();
        event.stopPropagation();
      } else {
        if (INSTANCE.getMode() == OperatingMode.Command) INSTANCE.getCli().processKeyDownEvent(event);
      }
    };

    onfocus = () => {
      INSTANCE.getStats().reset();
    }

    onmousedown = (event: MouseEvent) => {
      this.clickHandler.onMouseDown(event);
    }

    onmouseup = (event: MouseEvent) => {
      this.clickHandler.onMouseUp(event);
    }
  }

}


