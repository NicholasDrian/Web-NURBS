import { OperatingMode } from "./mode"
import { INSTANCE } from "./cad"

export class EventManager {

    constructor() {

        onkeydown =  (event: KeyboardEvent) => {
            if (event.code == "Escape") {
                if (INSTANCE.getMode() == OperatingMode.Navigation) {
                    INSTANCE.setMode(OperatingMode.Command);
                } else {
                    if (INSTANCE.getCli().hasInput()) {
                        INSTANCE.getCli().clearInput();
                    } else {
                        INSTANCE.setMode(OperatingMode.Navigation);
                    }
                }
            } else {
                if (INSTANCE.getMode() == OperatingMode.Command) INSTANCE.getCli().processKeyDownEvent(event);
            }
        };

        onfocus = () => {
            INSTANCE.getStats().reset();
        }

    }

}

