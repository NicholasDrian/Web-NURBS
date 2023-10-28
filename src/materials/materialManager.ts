import { vec4 } from "wgpu-matrix";
import { Material, MaterialName } from "./material";

export class MaterialManager {

  private materials: Map<MaterialName, Material>;
  private internalMaterials: Map<MaterialName, Material>;

  constructor() {
    this.materials = new Map<MaterialName, Material>();
    this.internalMaterials = new Map<MaterialName, Material>();
    this.createDefaultMaterial();
    this.createInternalMaterials();
  }

  private createDefaultMaterial(): void {
    this.materials.set("default", new Material("default", vec4.create(0.4, 0.4, 0.4, 1.0)));
  }

  public getDefaultMaterial(): Material {
    if (!this.materials.has("default")) this.createDefaultMaterial();
    return this.materials.get("default")!;
  }

  public getMaterials(): Map<MaterialName, Material> {
    return this.materials;
  }

  public addMaterial(name: MaterialName, mat: Material) {
    this.materials.set(name, mat);
  }

  public removeMaterial(name: MaterialName): void {
    this.materials.delete(name);
    if (this.materials.size === 0) this.createDefaultMaterial();
  }

  public getMaterial(name: MaterialName): Material | undefined {
    return this.materials.get(name);
  }

  public getInternalMaterial(name: MaterialName): Material | undefined {
    return this.internalMaterials.get(name);
  }

  public setInternalMaterial(name: MaterialName, mat: Material): void {
    this.internalMaterials.set(name, mat);
  }

  private createInternalMaterials(): void {
    this.internalMaterials.set("darker grey", new Material("darker grey", vec4.create(0.1, 0.1, 0.1, 1.0)));
    this.internalMaterials.set("dark grey", new Material("dark grey", vec4.create(0.3, 0.3, 0.3, 1.0)));
    this.internalMaterials.set("lighter grey", new Material("lighter grey", vec4.create(0.9, 0.9, 0.9, 1.0)));
    this.internalMaterials.set("light grey", new Material("light grey", vec4.create(0.7, 0.7, 0.7, 1.0)));
  }

}
