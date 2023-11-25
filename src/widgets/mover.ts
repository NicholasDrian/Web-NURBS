import { mat4, Mat4, vec3, Vec3, vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { BoundingBox } from "../geometry/boundingBox";
import { Geometry } from "../geometry/geometry";
import { Group } from "../geometry/group";
import { Mesh } from "../geometry/mesh";
import { createArc } from "../geometry/nurbs/arc";
import { Curve } from "../geometry/nurbs/curve";
import { loft } from "../geometry/nurbs/loft";
import { Surface } from "../geometry/nurbs/surface";
import { Plane } from "../geometry/plane";
import { Ray } from "../geometry/ray";
import { angleBetween, swizzleYZ } from "../utils/math";

export class Mover {

  private static readonly toXZPlane: Mat4 = mat4.uniformScale(mat4.rotateX(mat4.identity(), Math.PI / 2), 0.02);
  private static readonly toYZPlane: Mat4 = mat4.uniformScale(mat4.rotateY(mat4.identity(), Math.PI / -2), 0.02);
  private static readonly toXYPlane: Mat4 = mat4.uniformScale(mat4.identity(), 0.02);

  private originalModel: Mat4;
  private currentModel: Mat4;
  private active: boolean; // currently getting dragged
  private componentClicked: number | null;
  private originalIntersectionPoint: Vec3 | null;

  private surfaces: Group;
  private xyPlaneMover: Mesh;
  private xzPlaneMover: Mesh;
  private yzPlaneMover: Mesh;
  private xSpinner: Surface;
  private ySpinner: Surface;
  private zSpinner: Surface;

  private xAxisMover: Mesh;
  private yAxisMover: Mesh;
  private zAxisMover: Mesh;

  private xScaler: Mesh;
  private yScaler: Mesh;
  private zScaler: Mesh;

  private xyScaler: Mesh;
  private yzScaler: Mesh;
  private xzScaler: Mesh;

  private xyzScaler: Mesh;
  private moved: boolean;

  private element: HTMLDivElement;

  constructor() {
    this.active = false;
    this.moved = false;
    this.componentClicked = null;
    this.originalIntersectionPoint = null;
    this.originalModel = mat4.identity();
    this.currentModel = mat4.identity();

    this.element = document.createElement("div");
    this.element.id = "mover";
    this.element.className = "floating-window";
    this.element.style.width = "auto";
    this.element.style.height = "auto";
    this.element.hidden = true;
    document.body.appendChild(this.element);

    const origin: Vec3 = vec3.create(1, 1, 0);
    const xAxis: Vec3 = vec3.create(1, 0, 0);
    const yAxis: Vec3 = vec3.create(0, 1, 0);
    const spinnerInner: Curve = createArc(origin, xAxis, yAxis, 4, 0, Math.PI / 2);
    const spinnerOuter: Curve = createArc(origin, xAxis, yAxis, 5, 0, Math.PI / 2);
    this.zSpinner = loft([spinnerInner, spinnerOuter], 1);
    this.zSpinner.setMaterial("blue");
    this.ySpinner = loft([spinnerInner, spinnerOuter], 1);
    this.ySpinner.setMaterial("green");
    this.xSpinner = loft([spinnerInner, spinnerOuter], 1);
    this.xSpinner.setMaterial("red");

    this.xyzScaler = new Mesh(null,
      [vec3.create(0, 0, 0), vec3.create(1, 0, 0), vec3.create(1, 1, 0), vec3.create(0, 1, 0), vec3.create(0, 1, 1), vec3.create(0, 0, 1), vec3.create(1, 0, 1)],
      [vec3.create(0, 0, 0), vec3.create(0, 0, 0), vec3.create(0, 0, 0), vec3.create(0, 0, 0), vec3.create(0, 0, 0), vec3.create(0, 0, 0), vec3.create(0, 0, 0)],
      [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 1]
    );
    this.xyzScaler.setMaterial("white");

    this.xyPlaneMover = new Mesh(null,
      [vec3.create(1, 1, 0), vec3.create(3, 1, 0), vec3.create(3, 3, 0), vec3.create(1, 3, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]
    );
    this.xyPlaneMover.setMaterial("blue");

    this.xzPlaneMover = new Mesh(null,
      [vec3.create(1, 1, 0), vec3.create(3, 1, 0), vec3.create(3, 3, 0), vec3.create(1, 3, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]
    );
    this.xzPlaneMover.setMaterial("green");

    this.yzPlaneMover = new Mesh(null,
      [vec3.create(1, 1, 0), vec3.create(3, 1, 0), vec3.create(3, 3, 0), vec3.create(1, 3, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]
    );
    this.yzPlaneMover.setMaterial("red");


    this.xAxisMover = new Mesh(null,
      [vec3.create(1, 0, 0), vec3.create(1, 1, 0), vec3.create(6, 1, 0), vec3.create(6, 0, 0),
      vec3.create(6, 0, 1), vec3.create(1, 0, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1),
      vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0, 0, 3, 4, 4, 5, 0]);
    this.xAxisMover.setMaterial("red");

    this.yAxisMover = new Mesh(null,
      [vec3.create(0, 1, 0), vec3.create(1, 1, 0), vec3.create(1, 6, 0), vec3.create(0, 6, 0),
      vec3.create(0, 6, 1), vec3.create(0, 1, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1),
      vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0, 0, 3, 4, 4, 5, 0]);
    this.yAxisMover.setMaterial("green");


    this.zAxisMover = new Mesh(null,
      [vec3.create(0, 0, 1), vec3.create(1, 0, 1), vec3.create(1, 0, 6), vec3.create(0, 0, 6),
      vec3.create(0, 1, 6), vec3.create(0, 1, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1),
      vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0, 0, 3, 4, 4, 5, 0]);
    this.zAxisMover.setMaterial("blue");

    this.xScaler = new Mesh(null,
      [vec3.create(6, 0, 0), vec3.create(6.5, 1, 0), vec3.create(8, 0, 0), vec3.create(6.5, 0, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]);
    this.xScaler.setMaterial("red");

    this.yScaler = new Mesh(null,
      [vec3.create(0, 6, 0), vec3.create(1, 6.5, 0), vec3.create(0, 8, 0), vec3.create(0, 6.5, 1)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]);
    this.yScaler.setMaterial("green");

    this.zScaler = new Mesh(null,
      [vec3.create(0, 0, 6), vec3.create(0, 1, 6.5), vec3.create(0, 0, 8), vec3.create(1, 0, 6.5)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]);
    this.zScaler.setMaterial("blue");

    this.xyScaler = new Mesh(null,
      [vec3.create(4.5, 4.5, 0), vec3.create(5.5, 4.5, 0), vec3.create(7, 7, 0), vec3.create(4.5, 5.5, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]);
    this.xyScaler.setMaterial("blue");

    this.yzScaler = new Mesh(null,
      [vec3.create(4.5, 4.5, 0), vec3.create(5.5, 4.5, 0), vec3.create(7, 7, 0), vec3.create(4.5, 5.5, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]);
    this.yzScaler.setMaterial("red");

    this.xzScaler = new Mesh(null,
      [vec3.create(4.5, 4.5, 0), vec3.create(5.5, 4.5, 0), vec3.create(7, 7, 0), vec3.create(4.5, 5.5, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0]);
    this.xzScaler.setMaterial("green");



    this.surfaces = new Group([
      this.xyPlaneMover, this.xzPlaneMover, this.yzPlaneMover,
      this.xSpinner, this.ySpinner, this.zSpinner,
      this.xAxisMover, this.yAxisMover, this.zAxisMover,
      this.xyzScaler,
      this.xScaler, this.yScaler, this.zScaler,
      this.xyScaler, this.yzScaler, this.xzScaler]);

    this.surfaces.hide();
    this.surfaces.setOverlay(true);
    this.surfaces.setConstantScreenSize(true);

    // cleanup construction curves
    spinnerInner.destroy();
    spinnerOuter.destroy();

  }


  public onMouseMove(): void {
    if (!this.active) return;
    if (this.element.hidden === false) return;
    this.moved = true;

    const [x, y] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
    const originalPos: Vec3 = mat4.getTranslation(this.originalModel);

    switch (this.componentClicked) {
      case this.xyPlaneMover.getID(): {
        const xyPlane: Plane = new Plane(originalPos, vec3.create(0, 0, 1));
        const intersectionTime: number | null = ray.intersectPlane(xyPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const delta: Vec3 = vec3.sub(intersectionPoint, this.originalIntersectionPoint);
            this.currentModel = mat4.translate(this.originalModel, delta);
          }
        }
        break;
      }
      case this.yzPlaneMover.getID(): {
        const yzPlane: Plane = new Plane(originalPos, vec3.create(1, 0, 0));
        const intersectionTime: number | null = ray.intersectPlane(yzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const delta: Vec3 = vec3.sub(intersectionPoint, this.originalIntersectionPoint);
            this.currentModel = mat4.translate(this.originalModel, delta);
          }
        }
        break;
      }
      case this.xzPlaneMover.getID(): {
        const xzPlane: Plane = new Plane(originalPos, vec3.create(0, 1, 0));
        const intersectionTime: number | null = ray.intersectPlane(xzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const delta: Vec3 = vec3.sub(intersectionPoint, this.originalIntersectionPoint);
            this.currentModel = mat4.translate(this.originalModel, delta);
          }
        }
        break;
      }
      case this.xSpinner.getMesh().getID(): {
        const yzPlane: Plane = new Plane(originalPos, vec3.create(1, 0, 0));
        const intersectionTime: number | null = ray.intersectPlane(yzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const pos: Vec3 = originalPos;
            const v1: Vec3 = vec3.sub(this.originalIntersectionPoint, pos);
            const v2: Vec3 = vec3.sub(intersectionPoint, pos);
            var angle: number = angleBetween(v1, v2);
            if (vec3.dot(vec3.create(1, 0, 0), vec3.cross(v1, v2)) < 0) {
              angle *= -1;
            }
            this.currentModel = mat4.rotateX(this.originalModel, angle);
          }
        }
        break
      }
      case this.ySpinner.getMesh().getID(): {
        const xzPlane: Plane = new Plane(originalPos, vec3.create(0, 1, 0));
        const intersectionTime: number | null = ray.intersectPlane(xzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const pos: Vec3 = originalPos;
            const v1: Vec3 = vec3.sub(this.originalIntersectionPoint, pos);
            const v2: Vec3 = vec3.sub(intersectionPoint, pos);
            var angle: number = angleBetween(v1, v2);
            if (vec3.dot(vec3.create(0, 1, 0), vec3.cross(v1, v2)) < 0) {
              angle *= -1;
            }
            this.currentModel = mat4.rotateY(this.originalModel, angle);
          }
        }
        break;
      }
      case this.zSpinner.getMesh().getID(): {

        const xyPlane: Plane = new Plane(originalPos, vec3.create(0, 0, 1));
        const intersectionTime: number | null = ray.intersectPlane(xyPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const pos: Vec3 = originalPos;
            const v1: Vec3 = vec3.sub(this.originalIntersectionPoint, pos);
            const v2: Vec3 = vec3.sub(intersectionPoint, pos);
            var angle: number = angleBetween(v1, v2);
            if (vec3.dot(vec3.create(0, 0, 1), vec3.cross(v1, v2)) < 0) {
              angle *= -1;
            }
            this.currentModel = mat4.rotateZ(this.originalModel, angle);
          }
        }
        break;
      }
      case this.xAxisMover.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(1, 0, 0)));
        if (!this.originalIntersectionPoint) {
          this.originalIntersectionPoint = intersection;
        } else {
          this.currentModel = mat4.translate(this.originalModel, vec3.sub(intersection, this.originalIntersectionPoint));
        }
        break;
      }
      case this.yAxisMover.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(0, 1, 0)));
        if (!this.originalIntersectionPoint) {
          this.originalIntersectionPoint = intersection;
        } else {
          this.currentModel = mat4.translate(this.originalModel, vec3.sub(intersection, this.originalIntersectionPoint));
        }
        break;
      }
      case this.zAxisMover.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(0, 0, 1)));
        if (!this.originalIntersectionPoint) {
          this.originalIntersectionPoint = intersection;
        } else {
          this.currentModel = mat4.translate(this.originalModel, vec3.sub(intersection, this.originalIntersectionPoint));
        }
        break;
      }
      case this.xScaler.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(1, 0, 0)));
        if (!this.originalIntersectionPoint) {
          this.originalIntersectionPoint = intersection;
        } else {
          const originalDelta = this.originalIntersectionPoint[0] - originalPos[0];
          const newDelta = intersection[0] - originalPos[0];
          this.currentModel = mat4.scale(this.originalModel, vec3.create(newDelta / originalDelta, 1, 1));
        }
        break;
      }
      case this.yScaler.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(0, 1, 0)));
        if (!this.originalIntersectionPoint) {
          this.originalIntersectionPoint = intersection;
        } else {
          const originalDelta: number = this.originalIntersectionPoint[1] - originalPos[1];
          const newDelta: number = intersection[1] - originalPos[1];
          this.currentModel = mat4.scale(this.originalModel, vec3.create(1, newDelta / originalDelta, 1));
        }
        break;
      }
      case this.zScaler.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(0, 0, 1)));
        if (!this.originalIntersectionPoint) {
          this.originalIntersectionPoint = intersection;
        } else {
          const originalDelta: number = this.originalIntersectionPoint[2] - originalPos[2];
          const newDelta: number = intersection[2] - originalPos[2];
          this.currentModel = mat4.scale(this.originalModel, vec3.create(1, 1, newDelta / originalDelta));
        }
        break;
      }
      case this.xyScaler.getID(): {
        const xyPlane: Plane = new Plane(originalPos, vec3.create(0, 0, 1));
        const intersectionTime: number | null = ray.intersectPlane(xyPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const originalDelta: number = vec3.length(vec3.sub(this.originalIntersectionPoint, originalPos));
            const newDelta: number = vec3.length(vec3.sub(intersectionPoint, originalPos));
            const factor: number = newDelta / originalDelta;
            this.currentModel = mat4.scale(this.originalModel, vec3.create(factor, factor, 1));
          }
        }
        break;
      }
      case this.yzScaler.getID(): {
        const yzPlane: Plane = new Plane(originalPos, vec3.create(1, 0, 0));
        const intersectionTime: number | null = ray.intersectPlane(yzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const originalDelta: number = vec3.length(vec3.sub(this.originalIntersectionPoint, originalPos));
            const newDelta: number = vec3.length(vec3.sub(intersectionPoint, originalPos));
            const factor: number = newDelta / originalDelta;
            this.currentModel = mat4.scale(this.originalModel, vec3.create(1, factor, factor));
          }
        }
        break;
      }
      case this.xzScaler.getID(): {
        const xzPlane: Plane = new Plane(originalPos, vec3.create(0, 1, 0));
        const intersectionTime: number | null = ray.intersectPlane(xzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const originalDelta: number = vec3.length(vec3.sub(this.originalIntersectionPoint, originalPos));
            const newDelta: number = vec3.length(vec3.sub(intersectionPoint, originalPos));
            const factor: number = newDelta / originalDelta;
            this.currentModel = mat4.scale(this.originalModel, vec3.create(factor, 1, factor));
          }
        }
        break;
      }
      case this.xyzScaler.getID(): {
        const intersection: Vec3 = ray.closestPointOnLine(originalPos, vec3.add(originalPos, vec3.create(0, 0, 1)));
        if (this.originalIntersectionPoint === null) {
          this.originalIntersectionPoint = intersection;
        } else {
          var dz: number = intersection[2] - this.originalIntersectionPoint[2];
          if (dz > 0) dz += 1;
          else dz = -1 / (dz - 1);
          this.currentModel = mat4.scale(this.originalModel, vec3.create(dz, dz, dz));
        }
        break;
      }
      default:
        throw new Error("case not implemented");
    }
    this.surfaces.setModel(mat4.scale(this.currentModel, vec3.inverse(mat4.getScaling(this.currentModel))));
  }

  public onMouseUp(): void {
    if (this.active) {
      if (this.element.hidden) {
        if (this.moved) { // dragged
          this.moved = false;
          this.active = false;
          this.originalIntersectionPoint = null;
          INSTANCE.getScene().transformSelected(this.getTransform());
          this.updatedSelection();
          this.originalModel = this.currentModel;
        } else { // clicked
          this.originalIntersectionPoint = null;

          switch (this.componentClicked) {
            case this.xSpinner.getMesh().getID():
              this.element.innerHTML = "X Rotation: ";
              break;
            case this.ySpinner.getMesh().getID():
              this.element.innerHTML = "Y Rotation: ";
              break;
            case this.zSpinner.getMesh().getID():
              this.element.innerHTML = "Z Rotation: ";
              break;
            case this.xAxisMover.getID():
              this.element.innerHTML = "X Translation: ";
              break;
            case this.yAxisMover.getID():
              this.element.innerHTML = "Y Translation: ";
              break;
            case this.zAxisMover.getID():
              this.element.innerHTML = "Z Translation: ";
              break;
            case this.xScaler.getID():
              this.element.innerHTML = "X Scale: ";
              break;
            case this.yScaler.getID():
              this.element.innerHTML = "Y Scale: ";
              break;
            case this.zScaler.getID():
              this.element.innerHTML = "Z Scale: ";
              break;
            case this.xyScaler.getID():
              this.element.innerHTML = "XY Scale: ";
              break;
            case this.yzScaler.getID():
              this.element.innerHTML = "YZ Scale: ";
              break;
            case this.xzScaler.getID():
              this.element.innerHTML = "XZ Scale: ";
              break;
            case this.xyzScaler.getID():
              this.element.innerHTML = "Scale: ";
              break;
            default:
              this.active = false;
              this.originalIntersectionPoint = null;
              return;
          }
          const mousePos: [number, number] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
          this.element.setAttribute("style", `
          left:${mousePos[0] + 20}px;
          top:${mousePos[1] - 20}px;
          width:auto;
          height:auto;`
          );
          this.element.hidden = false;
        }
      } else { // active with text dialog
        this.active = false;
        this.element.hidden = true;
        this.originalIntersectionPoint = null;
        this.currentModel = this.originalModel;
      }
    }
  }

  public onkeydown(event: KeyboardEvent) {
    if (this.active && this.element.hidden === false) {
      if (event.code == "Enter") {
        this.active = false;
        this.element.hidden = true;
        this.originalIntersectionPoint = null;
        INSTANCE.getScene().transformSelected(this.getTransform());
        this.updatedSelection();
        this.originalModel = this.currentModel;
        return;
      }
      if (event.code == "Delete" || event.code == "Backspace" && this.element.innerHTML.at(-1) != ":") {
        this.element.innerHTML = this.element.innerHTML.slice(0, -1);
      } else if (event.key.length === 1) {
        this.element.innerHTML += event.key;
      }
      const input: string = this.element.innerHTML.split(":")[1];
      var parsedInput: number = parseFloat(input);
      switch (this.componentClicked) {
        case this.xSpinner.getMesh().getID():
          if (isNaN(parsedInput)) parsedInput = 0;
          this.currentModel = mat4.rotateX(this.originalModel, parsedInput / 180 * Math.PI);
          break;
        case this.ySpinner.getMesh().getID():
          if (isNaN(parsedInput)) parsedInput = 0;
          this.currentModel = mat4.rotateY(this.originalModel, parsedInput / 180 * Math.PI);
          break;
        case this.zSpinner.getMesh().getID():
          if (isNaN(parsedInput)) parsedInput = 0;
          this.currentModel = mat4.rotateZ(this.originalModel, parsedInput / 180 * Math.PI);
          break;
        case this.xAxisMover.getID():
          if (isNaN(parsedInput)) parsedInput = 0;
          this.currentModel = mat4.translate(this.originalModel, vec3.create(parsedInput, 0, 0));
          break;
        case this.yAxisMover.getID():
          if (isNaN(parsedInput)) parsedInput = 0;
          this.currentModel = mat4.translate(this.originalModel, vec3.create(0, parsedInput, 0));
          break;
        case this.zAxisMover.getID():
          if (isNaN(parsedInput)) parsedInput = 0;
          this.currentModel = mat4.translate(this.originalModel, vec3.create(0, 0, parsedInput));
          break;
        case this.xScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(parsedInput, 1, 1));
          break;
        case this.yScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(1, parsedInput, 1));
          break;
        case this.zScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(1, 1, parsedInput));
          break;
        case this.xyScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(parsedInput, parsedInput, 1));
          break;
        case this.yzScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(1, parsedInput, parsedInput));
          break;
        case this.xzScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(parsedInput, 1, parsedInput));
          break;
        case this.xyzScaler.getID():
          if (isNaN(parsedInput)) parsedInput = 1;
          this.currentModel = mat4.scale(this.originalModel, vec3.create(parsedInput, parsedInput, parsedInput));
          break;
      }
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public idClicked(id: number): void {
    if (!this.active) {
      if (this.element.hidden) {
        this.active = true;
        this.componentClicked = id;
      }
    }
  }

  public tick(): void {
    this.flip();
  }

  public updatedSelection(): void {
    const selection: Set<Geometry> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.surfaces.hide();
    } else {
      const selectionBB: BoundingBox = new BoundingBox();
      for (const geo of selection) {
        selectionBB.addBoundingBox(geo.getBoundingBox());
      }
      this.originalModel = mat4.translate(mat4.identity(), selectionBB.getCenter());
      this.currentModel = mat4.clone(this.originalModel);
      this.surfaces.setModel(this.originalModel);

      this.flip();
      this.surfaces.show();

    }
  }

  public flip(): void {

    const cameraPos: Vec3 = INSTANCE.getScene().getCamera().getPosition();
    const thisPos: Vec3 = mat4.getTranslation(this.currentModel);
    const dx: number = thisPos[0] - cameraPos[0];
    const dy: number = thisPos[1] - cameraPos[1];
    const dz: number = thisPos[2] - cameraPos[2];
    var flipper: Mat4 = mat4.scale(mat4.identity(), vec3.create(
      dx > 0 ? -1 : 1,
      dy > 0 ? -1 : 1,
      dz > 0 ? -1 : 1,
    ));

    this.xyPlaneMover.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.yzPlaneMover.setModel(mat4.mul(flipper, Mover.toYZPlane));
    this.xzPlaneMover.setModel(mat4.mul(flipper, Mover.toXZPlane));

    this.xSpinner.setModel(mat4.mul(flipper, Mover.toYZPlane));
    this.ySpinner.setModel(mat4.mul(flipper, Mover.toXZPlane));
    this.zSpinner.setModel(mat4.mul(flipper, Mover.toXYPlane));

    this.xAxisMover.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.yAxisMover.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.zAxisMover.setModel(mat4.mul(flipper, Mover.toXYPlane));

    this.xScaler.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.yScaler.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.zScaler.setModel(mat4.mul(flipper, Mover.toXYPlane));

    this.xyScaler.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.yzScaler.setModel(mat4.mul(flipper, Mover.toYZPlane));
    this.xzScaler.setModel(mat4.mul(flipper, Mover.toXZPlane));

    this.xyzScaler.setModel(mat4.mul(flipper, Mover.toXYPlane));
  }


  public getTransform(): Mat4 {
    return mat4.mul(this.currentModel, mat4.inverse(this.originalModel));
  }



}
