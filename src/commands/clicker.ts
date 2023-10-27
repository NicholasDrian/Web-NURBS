import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Plane } from "../geometry/plane";
import { Ray } from "../geometry/ray";
import { Cursor } from "../widgets/cursor";



export class Clicker {

  private point: Vec3 | null;
  private intersectionScreenPos: [number, number];
  private cursor: Cursor;

  constructor() {
    this.point = null;
    this.intersectionScreenPos = [-1, -1];
    this.cursor = new Cursor();
    this.onMouseMove();
  }

  // TODO: finish
  public onMouseMove(): void {

    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(mousePos[0], mousePos[1]);
    const tGroundPlane: number | null = ray.intersectPlane(new Plane(vec3.create(0, 0, 0), vec3.create(0, 0, 1)));

    var pGroundPlane: Vec3 | null = tGroundPlane ? ray.at(tGroundPlane!) : null;
    this.point = pGroundPlane;

    if (pGroundPlane && INSTANCE.getSettingsManager().getSnapSettingsManager().getSnapSettings().snapGrid) {
      pGroundPlane = INSTANCE.getScene().getConstructionPlane().snapToGrid(pGroundPlane!);
      this.point = pGroundPlane;
    }
    if (pGroundPlane) {
      this.intersectionScreenPos = INSTANCE.getScene().getCamera().getPixelAtPoint(pGroundPlane);
    }
    this.draw();
  }

  public getPoint(): Vec3 | null {
    return this.point;
  }

  public destroy(): void {
    this.cursor.destroy();
  }

  private draw(): void {
    this.cursor.setPosition(this.intersectionScreenPos);
  }

}
