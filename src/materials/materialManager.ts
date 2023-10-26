import { vec4 } from "wgpu-matrix";
import { Material } from "./material";

export class MaterialManager {

  private materials: Map<string, Material>;

  constructor() {
    this.materials = new Map<string, Material>();
    this.createDefaultMaterial();
  }

  private createDefaultMaterial(): void {
    this.materials.set("default", new Material("default", vec4.create(0.4, 0.4, 0.4, 1.0)));
  }

  public getMaterials(): Map<string, Material> {
    return this.materials;
  }

  public addMaterial(name: string, mat: Material) {
    this.materials.set(name, mat);
  }

  public removeMaterial(name: string): void {
    this.materials.delete(name);
  }

  public getMaterial(name: string): Material | undefined {
    return this.materials.get(name);
  }


}
