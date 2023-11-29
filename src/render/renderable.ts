import { mat4, Mat4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Geometry } from "../geometry/geometry";
import { swizzleYZ } from "../utils/math";
import { CONSTANT_SCREEN_SIZE_BIT, HOVER_BIT, SELECTED_BIT } from "./flags";




export abstract class Renderable {

  protected flags: Int32Array;
  protected objectIDBuffer: GPUBuffer;
  protected flagsBuffer: GPUBuffer;
  protected modelBufferPoints: GPUBuffer;
  protected modelBufferNormals: GPUBuffer;
  protected bindGroup!: GPUBindGroup;
  protected subSelectionBuffer: GPUBuffer | null;

  constructor(
    protected parent: Geometry,
    subSelection: boolean[],
    protected constantScreenSize: boolean = false
  ) {

    //model
    this.modelBufferPoints = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "model points",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.modelBufferNormals = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "model normals",
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
    if (this.constantScreenSize) this.flags[0] |= CONSTANT_SCREEN_SIZE_BIT;


    this.subSelectionBuffer = null;
    this.updateSubSelection(subSelection);

  }

  public setConstantScreenSpaceSize(on: boolean): void {
    if (on) {
      this.flags[0] |= CONSTANT_SCREEN_SIZE_BIT;
    } else {
      this.flags[0] &= ~CONSTANT_SCREEN_SIZE_BIT;
    }
  }

  public update(): void {
    this.updateFlags();
    this.updateModel();
    this.updateBindGroup();
  }

  public updateSubSelection(subSelection: boolean[]): void {

    const subSelectionList: number[] = [];
    for (let i = 0; i < subSelection.length; i++) {
      if (i % 32 === 0) { subSelectionList.push(0); }
      if (subSelection[i]) { subSelectionList[Math.floor(i / 32)] |= 1 << (i % 32); }
    }
    const subSelectionArray: Uint32Array = new Uint32Array(subSelectionList);
    if (this.subSelectionBuffer === null) {
      this.subSelectionBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
        label: "sub selection buffer",
        size: subSelectionArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.subSelectionBuffer, 0, subSelectionArray);

  }

  protected updateFlags(): void {
    if (this.parent.isSelected()) this.flags[0] |= SELECTED_BIT;
    else this.flags[0] &= ~SELECTED_BIT;
    if (this.parent.isHovered()) this.flags[0] |= HOVER_BIT;
    else this.flags[0] &= ~HOVER_BIT;
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.flagsBuffer, 0, this.flags);
  }

  protected updateModel(): void {
    const modelForPoints: Mat4 = this.parent.getModelRecursive();
    const modelForNormals: Mat4 = mat4.transpose(mat4.inverse(modelForPoints));
    INSTANCE.getRenderer().getDevice().queue
      .writeBuffer(this.modelBufferPoints, 0, <Float32Array>swizzleYZ(modelForPoints));
    INSTANCE.getRenderer().getDevice().queue
      .writeBuffer(this.modelBufferNormals, 0, <Float32Array>swizzleYZ(modelForNormals));
  }

  protected updateBindGroup(): void {
    this.bindGroup = INSTANCE.getRenderer().getDevice().createBindGroup({
      label: "renderable bind group",
      layout: INSTANCE.getRenderer().getBindGroupLayout(),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.modelBufferPoints },
        }, {
          binding: 1,
          resource: { buffer: this.modelBufferNormals },
        }, {
          binding: 2,
          resource: { buffer: this.parent.getColorBuffer() },
        }, {
          binding: 3,
          resource: { buffer: this.flagsBuffer }
        }, {
          binding: 4,
          resource: { buffer: this.objectIDBuffer }
        }, {
          binding: 5,
          resource: { buffer: this.subSelectionBuffer! }
        }
      ]
    });
  }

  public getParent(): Geometry {
    return this.parent;
  }

}
