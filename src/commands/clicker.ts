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
  private clicked: boolean;

  constructor() {
    this.point = null;
    this.intersectionScreenPos = [-1, -1];
    this.cursor = new Cursor();
    this.clicked = false;
    this.onMouseMove();
    this.element = document.createElement("div");
    this.element.id = "clicker";
    this.element.className = "floating-window";
    this.element.style.width = "auto";
    this.element.hidden = true;
    document.body.appendChild(this.element);
  }

  // TODO: finish
  public onMouseMove(): void {


    if (this.clicked) return; // currently selecting from dropdown

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

  public click(): void {
    if (this.clicked) return;
    this.element.hidden = false;
    this.clicked = true;
    const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(mousePos[0], mousePos[1]);
    const intersections: Intersection[] = INSTANCE.getScene().getBoundingBoxHeirarchy().firstIntersectionsWithinMargin(ray, 5);
    if (intersections.length === 0) this.reset();
    if (intersections.length === 1) {
      INSTANCE.getCommandManager().handleClickResult(intersections[0]);
      return;
    }

    const list: HTMLElement = document.createElement("ul");
    this.element.innerHTML = "";
    this.element.appendChild(list);
    for (let intersection of intersections) {
      const li = document.createElement("li");
      li.innerText = intersection.description;
      li.onclick = function() {
        INSTANCE.getCommandManager().handleClickResult(intersection);
      };
      list.appendChild(li);
    }

    this.element.setAttribute("style", `
      left:${mousePos[0]}px;
      top:${mousePos[1]}px;
      width:auto;
      height:auto;`
    );

  }

  public destroy(): void {

    this.cursor.destroy();
  }

  // TODO: remove this
  public getPoint(): Vec3 | null {
    return this.point;
  }

  private draw(): void {
    this.cursor.setPosition(this.intersectionScreenPos);
  }

  reset() {
    this.clicked = false;
    this.element.hidden = true;
  }

}
