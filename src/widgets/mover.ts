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
import { ObjectID, RenderID } from "../scene/scene";
import { angleBetween, swizzleYZ } from "../utils/math";

export class Mover {

  private static readonly toXZPlane: Mat4 = mat4.uniformScale(mat4.rotateX(mat4.identity(), Math.PI / 2), 0.02);
  private static readonly toYZPlane: Mat4 = mat4.uniformScale(mat4.rotateY(mat4.identity(), Math.PI / -2), 0.02);
  private static readonly toXYPlane: Mat4 = mat4.uniformScale(mat4.identity(), 0.02);

  private originalModel: Mat4;
  private currentModel: Mat4;
  private active: boolean; // currently getting dragged
  private componentClicked: ObjectID | null;
  private originalIntersectionPoint: Vec3 | null;

  private surfaces!: Group;
  private xyPlaneMover!: Surface;
  private xzPlaneMover!: Surface;
  private yzPlaneMover!: Surface;
  private xSpinner!: Surface;
  private ySpinner!: Surface;
  private zSpinner!: Surface;

  private xAxisMover!: Mesh;
  private yAxisMover!: Mesh;
  private zAxisMover!: Mesh;

  constructor() {
    this.active = false;
    this.componentClicked = null;
    this.originalIntersectionPoint = null;
    this.originalModel = mat4.identity();
    this.currentModel = mat4.identity();
    this.build();
  }

  private build(): void {

    const origin: Vec3 = vec3.create(0, 0, 0);
    const xAxis: Vec3 = vec3.create(1, 0, 0);
    const yAxis: Vec3 = vec3.create(0, 1, 0);

    // create construction lines
    const planeMoverInner: Curve = new Curve(null, [
      vec4.create(3, 4, 0, 1),
      vec4.create(4, 4, 0, 1),
      vec4.create(4, 3, 0, 1)],
      1);
    const planeMoverOuter: Curve = new Curve(null, [
      vec4.create(3, 5, 0, 1),
      vec4.create(5, 5, 0, 1),
      vec4.create(5, 3, 0, 1)],
      1);
    const spinnerInner: Curve = createArc(origin, xAxis, yAxis, 3, 0, Math.PI / 2);
    const spinnerOuter: Curve = createArc(origin, xAxis, yAxis, 4, 0, Math.PI / 2);

    // create surfaces
    this.xyPlaneMover = loft([planeMoverInner, planeMoverOuter], 1);
    this.xyPlaneMover.setMaterial("blue");
    this.zSpinner = loft([spinnerInner, spinnerOuter], 1);
    this.zSpinner.setMaterial("blue");
    this.xzPlaneMover = loft([planeMoverInner, planeMoverOuter], 1);
    this.xzPlaneMover.setMaterial("green");
    this.ySpinner = loft([spinnerInner, spinnerOuter], 1);
    this.ySpinner.setMaterial("green");
    this.yzPlaneMover = loft([planeMoverInner, planeMoverOuter], 1);
    this.yzPlaneMover.setMaterial("red");
    this.xSpinner = loft([spinnerInner, spinnerOuter], 1);
    this.xSpinner.setMaterial("red");


    this.xAxisMover = new Mesh(null,
      [vec3.create(0, 4, 0), vec3.create(3, 4, 0), vec3.create(3, 5, 0), vec3.create(0, 5, 0),
      vec3.create(0, 0, 4), vec3.create(3, 0, 4), vec3.create(3, 0, 5), vec3.create(0, 0, 5)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1),
      vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0, 4, 5, 6, 6, 7, 4]);
    this.xAxisMover.setMaterial("red");

    this.yAxisMover = new Mesh(null,
      [vec3.create(4, 0, 0), vec3.create(4, 3, 0), vec3.create(5, 3, 0), vec3.create(5, 0, 0),
      vec3.create(0, 0, 4), vec3.create(0, 3, 4), vec3.create(0, 3, 5), vec3.create(0, 0, 5)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1),
      vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0, 4, 5, 6, 6, 7, 4]);
    this.yAxisMover.setMaterial("green");

    this.zAxisMover = new Mesh(null,
      [vec3.create(0, 4, 0), vec3.create(0, 4, 3), vec3.create(0, 5, 3), vec3.create(0, 5, 0),
      vec3.create(4, 0, 0), vec3.create(4, 0, 3), vec3.create(5, 0, 3), vec3.create(5, 0, 0)],
      [vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1),
      vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1), vec3.create(0, 0, 1)],
      [0, 1, 2, 2, 3, 0, 4, 5, 6, 6, 7, 4]);
    this.zAxisMover.setMaterial("blue");


    this.surfaces = new Group([
      this.xyPlaneMover, this.xzPlaneMover, this.yzPlaneMover,
      this.xSpinner, this.ySpinner, this.zSpinner,
      this.xAxisMover, this.yAxisMover, this.zAxisMover]);

    this.surfaces.hide();
    this.surfaces.setOverlay(true);
    this.surfaces.setConstantScreenSize(true);

    // cleanup construction curves
    spinnerInner.destroy();
    spinnerOuter.destroy();
    planeMoverInner.destroy();
    planeMoverOuter.destroy();

  }


  public onMouseMove(): void {
    if (!this.active) return;
    const [x, y] = INSTANCE.getEventManager().getMouseHandler().getMousePos();
    const ray: Ray = INSTANCE.getScene().getCamera().getRayAtPixel(x, y);
    switch (this.componentClicked) {
      case this.xyPlaneMover.getMesh().getID(): {
        const xyPlane: Plane = new Plane(mat4.getTranslation(this.originalModel), vec3.create(0, 0, 1));
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
      case this.yzPlaneMover.getMesh().getID(): {
        const yzPlane: Plane = new Plane(mat4.getTranslation(this.originalModel), vec3.create(1, 0, 0));
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
      case this.xzPlaneMover.getMesh().getID(): {
        const xzPlane: Plane = new Plane(mat4.getTranslation(this.originalModel), vec3.create(0, 1, 0));
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
        const yzPlane: Plane = new Plane(mat4.getTranslation(this.originalModel), vec3.create(1, 0, 0));
        const intersectionTime: number | null = ray.intersectPlane(yzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const pos: Vec3 = mat4.getTranslation(this.originalModel);
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
        const xzPlane: Plane = new Plane(mat4.getTranslation(this.originalModel), vec3.create(0, 1, 0));
        const intersectionTime: number | null = ray.intersectPlane(xzPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const pos: Vec3 = mat4.getTranslation(this.originalModel);
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

        const xyPlane: Plane = new Plane(mat4.getTranslation(this.originalModel), vec3.create(0, 0, 1));
        const intersectionTime: number | null = ray.intersectPlane(xyPlane);
        if (intersectionTime) {
          const intersectionPoint: Vec3 = ray.at(intersectionTime);
          if (!this.originalIntersectionPoint) {
            this.originalIntersectionPoint = intersectionPoint;
          } else {
            const pos: Vec3 = mat4.getTranslation(this.originalModel);
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
        //TODO:
        break;
      }
      case this.yAxisMover.getID(): {
        //TODO:
        break;
      }
      case this.zAxisMover.getID(): {
        //TODO:
        break;
      }
      default:
        throw new Error("case not implemented");
    }
    this.surfaces.setModel(this.currentModel);
  }

  public onMouseUp(): void {
    if (this.active) {
      this.active = false;
      this.originalIntersectionPoint = null;
      INSTANCE.getScene().transformSelected(this.getTransform());
      this.updatedSelection();
      this.originalModel = this.currentModel;
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public idClicked(id: ObjectID): void {
    this.active = true;
    this.componentClicked = id;
  }

  public tick(): void {
    this.flip();
  }

  public updatedSelection(): void {
    const selection: Set<ObjectID> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.surfaces.hide();
    } else {
      const selectionBB: BoundingBox = new BoundingBox();
      for (const id of selection) {
        const geo: Geometry = INSTANCE.getScene().getGeometry(id);
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


  }


  public getTransform(): Mat4 {
    return mat4.mul(this.currentModel, mat4.inverse(this.originalModel));
  }



}
