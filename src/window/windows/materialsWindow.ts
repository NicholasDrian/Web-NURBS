import { warn } from "console";
import { INSTANCE } from "../../cad";
import { Material } from "../../materials/material";
import { vec4ToString } from "../../utils/print";
import { CADWindow } from "../window"


export class MaterialsWindow extends CADWindow {

  public populate(): void {
    const materials: Map<string, Material> = INSTANCE.getMaterialManager().getMaterials();
    var html: string = "<u>MATERIALS</u><br>";
    materials.forEach((mat: Material) => {
      html +=
        "name:" + mat.name +
        ", color:" + (mat.color !== null ? vec4ToString(mat.color!) : "none");
    });
    this.element.innerHTML = html;
  }

  public tick(): void {

  }

}
