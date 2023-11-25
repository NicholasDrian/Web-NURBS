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
  private showing: boolean = true;
  private overlay: boolean = false;
  private constantScreenSize: boolean = false;
  private id: ObjectID;

  constructor(
    protected parent: Geometry | null = null,
    protected model: Mat4 = mat4.identity(),
    protected materialName: MaterialName | null,
  ) {
    this.id = INSTANCE.getScene().generateNewObjectID(this);
  }

  public abstract getBoundingBox(): BoundingBox;
  public abstract getTypeName(): string;
  public abstract intersect(ray: Ray): Intersection | null;
  public abstract isWithinFrustum(frustum: Frustum, inclusive: boolean): boolean;

  public abstract addToSubSelection(subID: number): void;
  public abstract removeFromSubSelection(subID: number): void;
  public abstract isSubSelected(subID: number): boolean;

  public abstract delete(): void;
  public abstract clone(): Geometry;


  public isOverlay(): boolean {
    return this.overlay || (this.parent && this.parent.isOverlay()) || false;
  }

  public setOverlay(option: boolean) {
    this.overlay = option;
  }

  public isConstantScreenSize(): boolean {
    return this.constantScreenSize || (this.parent && this.parent.isConstantScreenSize()) || false;
  }

  public setConstantScreenSize(option: boolean) {
    this.constantScreenSize = option;
  }

  public setModel(model: Mat4): void {
    this.model = mat4.clone(model);
  }

  public getModel(): Mat4 {
    return mat4.clone(this.model);
  }

  public setParent(parent: Geometry): void {
    this.parent = parent;
  }

  public getModelRecursive(): Mat4 {
    if (this.parent) {
      return mat4.mul(this.parent.getModelRecursive(), this.model);
    } else {
      return mat4.clone(this.model);
    }
  }

  public getParent(): Geometry | null {
    return this.parent;
  }

  public isSelected(): boolean {
    if (this.selected) return true;
    if (this.parent && this.parent.isSelected()) return true;
    return false;
  }

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

  public hide(): void {
    this.showing = false;
  }

  public show(): void {
    this.showing = true;
  }

  public isHidden(): boolean {
    return !this.showing || (this.parent && this.parent.isHidden()) || false;
  }

  public setMaterial(name: MaterialName) {
    this.materialName = name;
  }

  public getColorBuffer(): GPUBuffer {

    if (this.materialName) {
      const mat: Material | undefined = INSTANCE.getMaterialManager().getMaterial(this.materialName);
      if (mat && mat.getColor()) {
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
      if (mat && mat.getColor()) {
        return mat.getColor()!;
      }
    }
    if (this.parent) {
      return this.parent.getColor();
    }
    return INSTANCE.getMaterialManager().getDefaultMaterial().getColor()!;
  }

  public transform(transform: Mat4): void {
    this.model = mat4.mul(transform, this.model);
  }

}
