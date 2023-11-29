import { vec4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../../cad";
import { Material } from "../../materials/material";
import { CADWindow } from "../window"


export class MaterialsWindow extends CADWindow {

  private selectedMaterial: Material | null;

  constructor(
    name: string,
    start: [number, number],
    end: [number, number]
  ) {
    super(name, start, end);
    this.selectedMaterial = null
    this.renderMaterialList();
  }

  public populate(): void {
  }

  public tick(): void {
  }

  private renderMaterialList(): void {
    const materials: Map<string, Material> = INSTANCE.getMaterialManager().getMaterials();

    this.element.innerHTML = "<u>Materials:</u><br><br>";

    const list: HTMLElement = document.createElement("ul");

    const newMaterialButton: HTMLElement = document.createElement("li");
    newMaterialButton.innerHTML = "<b>Create New Material</b>";
    newMaterialButton.onclick = function() {
      const mat = new Material("");
      const thisWindow: MaterialsWindow = <MaterialsWindow>INSTANCE.getWindowManager().getWindows().get("materials");
      thisWindow.setSelectedMaterial(mat);
    };
    list.appendChild(newMaterialButton);

    for (const [name, material] of materials) {
      const element: HTMLElement = document.createElement("li");
      element.innerHTML = name;
      element.onmousedown = function(ev: MouseEvent) {
        const thisWindow: MaterialsWindow = <MaterialsWindow>INSTANCE.getWindowManager().getWindows().get("materials");
        thisWindow.setSelectedMaterial(material);
        ev.stopPropagation();
      }
      list.appendChild(element);
    }
    this.element.appendChild(list);
  }

  private createSlider(id: string, min: number, max: number, initialValue: number): HTMLInputElement {
    const res: HTMLInputElement = document.createElement("input");
    res.setAttribute("type", "range");
    res.setAttribute("min", min.toString());
    res.setAttribute("max", max.toString());
    res.setAttribute("step", "0.01");
    res.style.width = "12em";
    res.setAttribute("value", initialValue.toString());
    res.setAttribute("id", id);
    return res;
  }

  private renderMaterial(): void {

    const name: string = this.selectedMaterial!.getName();
    const color: Vec4 = this.selectedMaterial!.getColor();
    const emissive: Vec4 = this.selectedMaterial!.getEmissive();
    const ambientIntensity: number = this.selectedMaterial!.getAmbientIntensity();
    const diffuseIntensity: number = this.selectedMaterial!.getPseudoDiffuseIntensity();
    const specularity: number = this.selectedMaterial!.getSpecularity();
    const specularIntensity: number = this.selectedMaterial!.getSpecularIntensity();

    this.element.innerHTML = "<b><u>Materials:</u></b><br>";

    this.element.innerHTML += "<br><b>Color:<b>";
    this.element.innerHTML += "<br>R:";
    this.element.appendChild(this.createSlider("colorRedSlider", 0, 1, color[0]));
    this.element.innerHTML += "<br>G:";
    this.element.appendChild(this.createSlider("colorGreenSlider", 0, 1, color[1]));
    this.element.innerHTML += "<br>B:";
    this.element.appendChild(this.createSlider("colorBlueSlider", 0, 1, color[2]));
    this.element.innerHTML += "<br>A:";
    this.element.appendChild(this.createSlider("colorAlphaSlider", 0, 1, color[3]));

    this.element.innerHTML += "<br><b>Emissive:<b>";
    this.element.innerHTML += "<br>R:";
    this.element.appendChild(this.createSlider("emissiveRedSlider", 0, 1, emissive[0]));
    this.element.innerHTML += "<br>G:";
    this.element.appendChild(this.createSlider("emissiveGreenSlider", 0, 1, emissive[1]));
    this.element.innerHTML += "<br>B:";
    this.element.appendChild(this.createSlider("emissiveBlueSlider", 0, 1, emissive[2]));
    this.element.innerHTML += "<br>A:";
    this.element.appendChild(this.createSlider("emissiveAlphaSlider", 0, 1, emissive[3]));

    this.element.innerHTML += "<br><b>Ambient Intensity:<b>";
    this.element.appendChild(this.createSlider("ambientIntensity", 0, 1, ambientIntensity));

    this.element.innerHTML += "<br><b>Diffuse Intensity:<b>";
    this.element.appendChild(this.createSlider("diffuseIntensity", 0, 1, diffuseIntensity));

    this.element.innerHTML += "<br><b>Specularity:<b>";
    this.element.appendChild(this.createSlider("specularity", 0, 7, Math.log2(specularity)));

    this.element.innerHTML += "<br><b>Specular Intensity:<b>";
    this.element.appendChild(this.createSlider("specularIntensity", 0, 1, specularIntensity));

    this.element.innerHTML += "<br><b>Name: <b>";
    const nameField: HTMLInputElement = document.createElement("input");
    nameField.setAttribute("value", name);
    nameField.style.width = "9em";
    nameField.setAttribute("id", "name field");
    this.element.appendChild(nameField);

    const nameSubmitButton: HTMLElement = document.createElement("button");
    nameSubmitButton.innerHTML = "<b>Save Name</b>";
    nameSubmitButton.style.width = "13em";
    nameSubmitButton.onclick = function(ev: MouseEvent) {
      const thisWindow: MaterialsWindow = <MaterialsWindow>INSTANCE.getWindowManager().getWindows().get("materials");
      thisWindow.updatedName();
      ev.stopPropagation();
    };
    this.element.appendChild(nameSubmitButton);


    const backButton: HTMLElement = document.createElement("button");
    backButton.innerHTML = "<b>Back</b>";
    backButton.onclick = function(ev: MouseEvent) {
      const thisWindow: MaterialsWindow = <MaterialsWindow>INSTANCE.getWindowManager().getWindows().get("materials");
      thisWindow.setSelectedMaterial(null);
      ev.stopPropagation();
    };
    this.element.appendChild(backButton);

    const deleteButton: HTMLElement = document.createElement("button");
    deleteButton.innerHTML = "<b>Delete</b>"
    deleteButton.onclick = function(ev: MouseEvent) {
      const thisWindow: MaterialsWindow = <MaterialsWindow>INSTANCE.getWindowManager().getWindows().get("materials");
      const mat: Material = thisWindow.getSelectedMaterial()!;
      INSTANCE.getMaterialManager().removeMaterial(mat.getName());
      thisWindow.setSelectedMaterial(null);
      ev.stopPropagation();
    };
    this.element.appendChild(deleteButton);

    this.element.oninput = function(ev: Event) {
      const thisWindow: MaterialsWindow = <MaterialsWindow>INSTANCE.getWindowManager().getWindows().get("materials");
      thisWindow.updatedMaterial();
      ev.stopPropagation();
    }
  }

  public updatedName(): void {
    const name: string = (<HTMLInputElement>document.getElementById("name field")).value
    if (name == "") {
      alert("Invalid Name");
      return;
    }
    INSTANCE.getMaterialManager().removeMaterial(this.selectedMaterial!.getName());
    this.selectedMaterial!.setName(name);
    INSTANCE.getMaterialManager().addMaterial(this.selectedMaterial!.getName(), this.selectedMaterial!);
  }

  public updatedMaterial() {
    const colorR: number = parseFloat((<HTMLInputElement>document.getElementById("colorRedSlider")).value);
    const colorG: number = parseFloat((<HTMLInputElement>document.getElementById("colorGreenSlider")).value);
    const colorB: number = parseFloat((<HTMLInputElement>document.getElementById("colorBlueSlider")).value);
    const colorA: number = parseFloat((<HTMLInputElement>document.getElementById("colorAlphaSlider")).value);
    this.selectedMaterial!.updateColor(vec4.create(colorR, colorG, colorB, colorA));

    const emissiveR: number = parseFloat((<HTMLInputElement>document.getElementById("emissiveRedSlider")).value);
    const emissiveG: number = parseFloat((<HTMLInputElement>document.getElementById("emissiveGreenSlider")).value);
    const emissiveB: number = parseFloat((<HTMLInputElement>document.getElementById("emissiveBlueSlider")).value);
    const emissiveA: number = parseFloat((<HTMLInputElement>document.getElementById("emissiveAlphaSlider")).value);
    this.selectedMaterial!.updateEmissive(vec4.create(emissiveR, emissiveG, emissiveB, emissiveA));

    const ambientIntensity: number = parseFloat((<HTMLInputElement>document.getElementById("ambientIntensity")).value);
    this.selectedMaterial!.updateAmbientIntensity(ambientIntensity);

    const diffuseIntensity: number = parseFloat((<HTMLInputElement>document.getElementById("diffuseIntensity")).value);
    this.selectedMaterial!.updatePseudoDiffuseIntensity(diffuseIntensity);

    const specularity: number = parseFloat((<HTMLInputElement>document.getElementById("specularity")).value);
    this.selectedMaterial!.updateSpecularity(Math.pow(2, specularity));

    const specularIntensity: number = parseFloat((<HTMLInputElement>document.getElementById("specularIntensity")).value);
    this.selectedMaterial!.updateSpecularIntensity(specularIntensity);
  }

  public getSelectedMaterial(): Material | null {
    return this.selectedMaterial;
  }

  public setSelectedMaterial(material: Material | null): void {
    this.selectedMaterial = material;
    if (this.selectedMaterial) {
      this.renderMaterial();
    } else {
      this.renderMaterialList();
    }
  }

}
