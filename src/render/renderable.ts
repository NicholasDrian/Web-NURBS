import { INSTANCE } from "../cad";
import { Geometry } from "../geometry/geometry";
import { ObjectID } from "../scene/scene";




export abstract class Renderable {

  protected renderID: number;
  protected flags: Int32Array;
  protected objectIDBuffer: GPUBuffer;
  protected flagsBuffer: GPUBuffer;
  protected modelBuffer: GPUBuffer;

  constructor(
    protected parent: Geometry,
  ) {

    this.renderID = INSTANCE.getScene().generateNewRenderID();


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
    const objectIDArray: Int32Array = new Int32Array([this.parent.getID()])
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.objectIDBuffer, 0, objectIDArray);



    this.flagsBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "render lines flags buffer",
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    this.flags = new Int32Array([0]);


  }

  public getRenderID(): number {
    return this.renderID;
  }

  public getParent(): Geometry {
    return this.parent;
  }

}
