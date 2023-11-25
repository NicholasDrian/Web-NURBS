import { Mat4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Geometry } from "../geometry/geometry";
import { ObjectID } from "../scene/scene";
import { swizzleYZ } from "../utils/math";
import { CONSTANT_SCREEN_SIZE_BIT, HOVER_BIT, SELECTED_BIT } from "./flags";




export abstract class Renderable {

  protected flags: Int32Array;
  protected objectIDBuffer: GPUBuffer;
  protected flagsBuffer: GPUBuffer;
  protected modelBuffer: GPUBuffer;
  protected bindGroup!: GPUBindGroup;
  protected subSelectionBuffer: GPUBuffer | null;

  constructor(
    protected parent: Geometry,
    subSelection: boolean[],
  ) {

    //model
    this.modelBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "mvp",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    // id
    this.objectIDBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "id buffer",
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const objectIDArray: Int32Array = new Int32Array([this.parent.getID()]);
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.objectIDBuffer, 0, objectIDArray);


    //flags
    this.flagsBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "renderable flag buffer",
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.flags = new Int32Array([0]);


    this.subSelectionBuffer = null;
    this.updateSubSelection(subSelection);

  }

  public update(): void {
    this.updateFlags();
    this.updateModel();
    this.updateBindGroup();
  }

  public updateSubSelection(subSelection: boolean[]): void {
    // sub selection
    const subSelectionList: number[] = [];
    for (let i = 0; i < subSelection.length; i++) {
      if (i % 32 === 0) { subSelectionList.push(0); }
      if (subSelection[i]) { subSelectionList[i / 32] |= 1 << (i % 32); }
    }
    const subSelectionArray: Int32Array = new Int32Array(subSelectionList);
    if (this.subSelectionBuffer === null) {
      this.subSelectionBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
        label: "sub selection buffer",
        size: subSelectionArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.subSelectionBuffer, 0, subSelectionArray);
  }

  protected updateFlags(): void {
    if (this.parent.isSelected()) this.flags[0] |= SELECTED_BIT;
    else this.flags[0] &= ~SELECTED_BIT;
    if (this.parent.isHovered()) this.flags[0] |= HOVER_BIT;
    else this.flags[0] &= ~HOVER_BIT;
    if (this.parent.isConstantScreenSize()) this.flags[0] |= CONSTANT_SCREEN_SIZE_BIT;
    else this.flags[0] &= ~CONSTANT_SCREEN_SIZE_BIT;
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.flagsBuffer, 0, this.flags);
  }

  protected updateModel(): void {
    const model: Mat4 = this.parent.getModelRecursive();
    swizzleYZ(model);
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.modelBuffer, 0, <Float32Array>model);
  }

  protected updateBindGroup(): void {
    this.bindGroup = INSTANCE.getRenderer().getDevice().createBindGroup({
      label: "renderable bind group",
      layout: INSTANCE.getRenderer().getBindGroupLayout(),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.modelBuffer },
        }, {
          binding: 1,
          resource: { buffer: this.parent.getColorBuffer() },
        }, {
          binding: 2,
          resource: { buffer: this.flagsBuffer }
        }, {
          binding: 3,
          resource: { buffer: this.objectIDBuffer }
        }, {
          binding: 4,
          resource: { buffer: this.subSelectionBuffer! }
        }
      ]
    });
  }

  public getParent(): Geometry {
    return this.parent;
  }

}
