import { OperatingMode } from "../mode"
import { INSTANCE } from "../cad"
import { MouseEventHandler } from "./mouseEventManager";

export class EventManager {

    private mouseEventHandler: MouseEventHandler;

    constructor() {

        this.mouseEventHandler = new MouseEventHandler();

        onresize = () => {
            INSTANCE.getRenderer().updateScreenSize();
        }

        onkeydown =  (event: KeyboardEvent) => {
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

        onclick = (event: MouseEvent) => {
            this.mouseEventHandler.handleMouseEvent(event);
        }

    }

}

