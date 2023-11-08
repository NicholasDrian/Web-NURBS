import { mat4, Mat4, Vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Material, MaterialName } from "../materials/material";
import { ObjectID } from "../scene/scene";
import { BoundingBox } from "./boundingBox";
import { Frustum } from "./frustum";
import { Intersection } from "./intersection";
import { Ray } from "./ray";


export abstract class Geometry {

  private selected: boolean = false;
  private hovered: boolean = false;
  private id: ObjectID;


  constructor(
    private parent: Geometry | null = null,
    private model: Mat4 = mat4.identity(),
    private materialName: MaterialName | null,
  ) {
    this.id = INSTANCE.getScene().generateNewObjectID(this);
  }

  public abstract getBoundingBox(): BoundingBox;
  public abstract getTypeName(): string;
  public abstract intersect(ray: Ray): Intersection | null;
  public abstract isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean;

  public setModel(model: Mat4): void {
    this.model = model;
  }

  public getModelRecursive(): Mat4 {
    if (this.parent) {
      return mat4.mul(this.parent.getModelRecursive(), this.model);
    } else {
      return this.model;
    }
  }

  public getModel(): Mat4 {
    return this.model;
  }

  getParent(): Geometry | null {
    return this.parent;
  }

  // an object is selected if its parent is selected
  public isSelected(): boolean {
    if (this.selected) return true;
    if (this.parent && this.parent.isSelected()) return true;
    return false;
  }

  // find parent and select it. return id of selected object
  public select(): void {
    this.selected = true;
  }

  public unSelect(): void {
    this.selected = false;
  }

  public isHovered(): boolean {
    if (this.hovered) return true;
    if (this.parent && this.parent.isHovered()) return true;
    return false;
  }

  public hover(): void {
    this.hovered = true;
  }

  public unHover(): void {
    this.hovered = false;
  }

  public getID(): ObjectID {
    return this.id;
  }

  public setMaterial(name: MaterialName) {
    this.materialName = name;
  }

  public getColorBuffer(): GPUBuffer {

    if (this.materialName) {
      const mat: Material | undefined = INSTANCE.getMaterialManager().getMaterial(this.materialName);
      if (mat && mat.color) {
        return mat.getColorBuffer()!;
      }
    }
    if (this.parent) {
      return this.parent.getColorBuffer();
    }
    return INSTANCE.getMaterialManager().getDefaultMaterial().getColorBuffer()!;
  }

  public getColor(): Vec4 {
    if (this.materialName) {
      const mat: Material | undefined = INSTANCE.getMaterialManager().getMaterial(this.materialName);
      if (mat && mat.color) {
        return mat.color;
      }
    }
    if (this.parent) {
      return this.parent.getColor();
    }
    return INSTANCE.getMaterialManager().getDefaultMaterial().color!;
  }

}
