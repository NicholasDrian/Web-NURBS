import { OperatingMode } from "../mode"
import { INSTANCE } from "../cad"
import { MouseHandler } from "./mouseHandler";


export class EventManager {

  private mouseHandler: MouseHandler;

  constructor() {

    this.mouseHandler = new MouseHandler();

    onmousemove = (event: MouseEvent) => {

      INSTANCE.getEventQueue().pushEvent(() => {
        this.mouseHandler.onMouseMove(event);
      });

    };

    onresize = () => {
      INSTANCE.getEventQueue().pushEvent(() => {
        INSTANCE.getRenderer().updateScreenSize();
      });
    }

    onkeydown = (event: KeyboardEvent) => {
      INSTANCE.getEventQueue().pushEvent(() => {
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
          else if (event.code == "Delete" || event.code == "Backspace") {
            INSTANCE.getScene().deleteSelected();
          }
          INSTANCE.getMover().onkeydown(event);
        }
      });
    };

    onfocus = () => {
      INSTANCE.getEventQueue().pushEvent(() => {
        INSTANCE.getStats().reset();
      });
    }

    onmousedown = (event: MouseEvent) => {
      INSTANCE.getEventQueue().pushEvent(() => {
        this.mouseHandler.onMouseDown(event);
      });
    }

    onmouseup = (event: MouseEvent) => {
      INSTANCE.getEventQueue().pushEvent(() => {
        this.mouseHandler.onMouseUp(event);
      });
    }
  }

  public getMouseHandler(): MouseHandler {
    return this.mouseHandler;
  }

}


