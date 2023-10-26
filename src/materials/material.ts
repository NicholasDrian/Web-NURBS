import { Vec4 } from "wgpu-matrix";

export class Material {

  constructor(
    public name: string,
    public color: Vec4 | null,
  ) {

  }

}
