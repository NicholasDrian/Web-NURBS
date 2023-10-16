import { OperatingMode } from "../mode"
import { INSTANCE } from "../cad"

export class EventManager {

    constructor() {

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

    }

}

