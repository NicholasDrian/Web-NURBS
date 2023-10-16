import { INSTANCE } from "../../cad";
import { ConstructionPlane } from "../../scene/constructionPlane";

var isDarkMode: boolean = true;

export function toggleDarkMode() {
    if (isDarkMode) setLightMode();
    else setDarkMode();
}

function setLightMode() {
    isDarkMode = false;
    INSTANCE.getRenderer().setClearColor([0.9, 0.9, 0.9, 1.0]);
    INSTANCE.getScene().getConstructionPlane().setMajorColor([0.3, 0.1, 0.1, 1.0]);
    INSTANCE.getScene().getConstructionPlane().setMinorColor([0.8, 0.6, 0.6, 1.0]);
}

function setDarkMode() {
    isDarkMode = true;
    INSTANCE.getRenderer().setClearColor([0.1, 0.1, 0.1, 1.0]);
    INSTANCE.getScene().getConstructionPlane().setMajorColor([1.0, 0.8, 0.8, 1.0]);
    INSTANCE.getScene().getConstructionPlane().setMinorColor([0.6, 0.4, 0.4, 1.0]);
}
