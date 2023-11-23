import { INSTANCE } from "../../cad";

var isDarkMode: boolean = true;

const rootStyle: HTMLStyleElement = <HTMLStyleElement>document.querySelector(':root');

export function toggleDarkMode() {
  if (isDarkMode) setLightMode();
  else setDarkMode();
}

function setLightMode() {
  isDarkMode = false;
  INSTANCE.getRenderer().setClearColor([0.8, 0.8, 0.8, 1.0]);
  INSTANCE.getScene().getConstructionPlane().setMajorMaterial("darker grey");
  rootStyle.style.setProperty("--floating-window-background-color", "var(--transparent-white)");
  rootStyle.style.setProperty("--floating-window-text-color", "var(--dark-red)");
  rootStyle.style.setProperty("--floating-window-border-color", "var(--dark-red)");

}

function setDarkMode() {
  isDarkMode = true;
  INSTANCE.getRenderer().setClearColor([0.1, 0.1, 0.1, 1.0]);
  INSTANCE.getScene().getConstructionPlane().setMajorMaterial("lighter grey");
  rootStyle.style.setProperty("--floating-window-background-color", "var(--transparent-black)");
  rootStyle.style.setProperty("--floating-window-text-color", "var(--light-red)");
  rootStyle.style.setProperty("--floating-window-border-color", "var(--light-red)");
}
