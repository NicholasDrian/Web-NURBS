import { Vec4 } from "wgpu-matrix";

export type MaterialName = string;

export class Material {

  constructor(
    public name: string,
    public color: Vec4 | null,
  ) {

  }

}
