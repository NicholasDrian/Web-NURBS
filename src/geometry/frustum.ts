import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Ray } from "./ray";

export class Frustum {

  private origin: Vec3;
  private up: Vec3;
  private right: Vec3;
  private down: Vec3;
  private left: Vec3;

  constructor(left: number, right: number, top: number, bottom: number) {
    this.origin = INSTANCE.getScene().getCamera().getPosition();
    const topLeft: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(left, top);
    const topRight: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(left, right);
    const bottomLeft: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(bottom, top);
    const bottomRight: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(bottom, right);
    this.up = vec3.normalize(vec3.cross(topLeft.getDirection(), topRight.getDirection()));
    this.right = vec3.normalize(vec3.cross(topRight.getDirection(), bottomRight.getDirection()));
    this.down = vec3.normalize(vec3.cross(bottomRight.getDirection(), bottomLeft.getDirection()));
    this.left = vec3.normalize(vec3.cross(bottomLeft.getDirection(), topLeft.getDirection()));
  }



}
