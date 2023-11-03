import { Vec3 } from "wgpu-matrix";
import { ObjectID } from "../scene/scene";

export class Intersection {


  constructor(
    public time: number,
    public description: string,
    public object: ObjectID,
    public point: Vec3,
    public dist: number
  ) { }

}
