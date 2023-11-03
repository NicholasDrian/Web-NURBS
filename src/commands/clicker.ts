import { vec3, Vec3 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { Intersection } from "../geometry/intersection";
import { Plane } from "../geometry/plane";
import { Ray } from "../geometry/ray";
import { ObjectID } from "../scene/scene";
import { Cursor } from "../widgets/cursor";



export class Clicker {

  private point: Vec3 | null;
  private intersectionScreenPos: [number, number];
  private cursor: Cursor;
  private element: HTMLDivElement;

  constructor() {
    this.point = null;
    this.intersectionScreenPos = [-1, -1];
    this.cursor = new Cursor();
    this.onMouseMove();
    this.element = document.createElement("div");
    this.element.id = "clicker";
    this.element.className = "floating-window";
  }

  // TODO: finish
  public onMouseMove(): void {

    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(mousePos[0], mousePos[1]);

    const tScene: Intersection | null = ray.intersectScene(INSTANCE.getScene());
    if (tScene) {
      this.point = tScene.point;
      this.intersectionScreenPos = INSTANCE.getScene().getCamera().getPixelAtPoint(this.point);
      this.draw();
      return;
    }

    const tGroundPlane: number | null = ray.intersectPlane(new Plane(vec3.create(0, 0, 0), vec3.create(0, 0, 1)));
    var pGroundPlane: Vec3 | null = tGroundPlane ? ray.at(tGroundPlane!) : null;
    this.point = pGroundPlane;

    if (pGroundPlane && INSTANCE.getSettingsManager().getSnapSettingsManager().getSnapSettings().snapGrid) {
      pGroundPlane = INSTANCE.getScene().getConstructionPlane().snapToGrid(pGroundPlane!);
      this.point = pGroundPlane;
    }
    if (pGroundPlane) {
      this.intersectionScreenPos = INSTANCE.getScene().getCamera().getPixelAtPoint(pGroundPlane);
      this.draw();
    }
  }

  public async click(): Promise<Intersection> {
    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(mousePos[0], mousePos[1]);
    const intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5);
    var html: string = "<ul>";
    for (let intersection of intersections) {
      // TODO: add on click
      html += "<li>" + intersection.description.toString() + "<li>";
    }
    html += "<ul>";
    this.element.innerHTML = html;
    this.element.style.width = "100px";
    this.element.style.height = "100px";
    this.element.style.left = mousePos[0].toString();
    this.element.style.right = mousePos[1].toString();
    document.body.appendChild(this.element);
    return intersections[0];
  }

  public destroy(): void {
    //document.body.removeChild(this.element);

    this.cursor.destroy();
  }

  // TODO: remove this
  public getPoint(): Vec3 | null {
    return this.point;
  }

  private draw(): void {
    this.cursor.setPosition(this.intersectionScreenPos);
  }

}
