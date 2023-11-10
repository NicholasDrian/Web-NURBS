import { INSTANCE } from "../cad";




export abstract class Renderable {

  private renderID: number;

  constructor() {
    this.renderID = INSTANCE.getScene().generateNewRenderID();
  }

  public getRenderID(): number {
    return this.renderID;
  }

}
