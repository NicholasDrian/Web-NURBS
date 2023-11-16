import { mat4, Mat4, vec3, Vec3, vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { BoundingBox } from "../geometry/boundingBox";
import { Geometry } from "../geometry/geometry";
import { Group } from "../geometry/group";
import { createArc } from "../geometry/nurbs/arc";
import { Curve } from "../geometry/nurbs/curve";
import { loft } from "../geometry/nurbs/loft";
import { Surface } from "../geometry/nurbs/surface";
import { ObjectID } from "../scene/scene";

export class Mover {

  private static readonly toXZPlane: Mat4 = mat4.uniformScale(mat4.rotateX(mat4.identity(), Math.PI / 2), 0.02);
  private static readonly toYZPlane: Mat4 = mat4.uniformScale(mat4.rotateY(mat4.identity(), Math.PI / -2), 0.02);
  private static readonly toXYPlane: Mat4 = mat4.uniformScale(mat4.identity(), 0.02);

  private originalModel!: Mat4;
  private currentModel!: Mat4;
  private enabled: boolean;
  private transformBuffer: GPUBuffer;
  private surfaces!: Group;
  private xyPlaneMover!: Surface;
  private xzPlaneMover!: Surface;
  private yzPlaneMover!: Surface;
  private xSpinner!: Surface;
  private ySpinner!: Surface;
  private zSpinner!: Surface;

  constructor() {
    this.enabled = false;
    this.transformBuffer = INSTANCE.getRenderer().getDevice().createBuffer({
      label: "selection transform buffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    INSTANCE.getRenderer().getDevice().queue.writeBuffer(this.transformBuffer, 0, <Float32Array>mat4.identity());
    this.build();
  }

  private build(): void {

    const origin: Vec3 = vec3.create(0, 0, 0);
    const xAxis: Vec3 = vec3.create(1, 0, 0);
    const yAxis: Vec3 = vec3.create(0, 1, 0);

    // create construction lines
    const planeMoverInner: Curve = new Curve(null, [
      vec4.create(1, 0, 0, 1),
      vec4.create(1, 1, 0, 1),
      vec4.create(0, 1, 0, 1)],
      1);
    const planeMoverOuter: Curve = new Curve(null, [
      vec4.create(2, 0, 0, 1),
      vec4.create(2, 2, 0, 1),
      vec4.create(0, 2, 0, 1)],
      1);
    const spinnerInner: Curve = createArc(origin, xAxis, yAxis, Math.sqrt(8), 0, Math.PI / 2);
    const spinnerOuter: Curve = createArc(origin, xAxis, yAxis, Math.sqrt(8) + 1, 0, Math.PI / 2);

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
    this.surfaces = new Group([this.xyPlaneMover, this.xzPlaneMover, this.yzPlaneMover, this.xSpinner, this.ySpinner, this.zSpinner]);
    this.surfaces.hide();
    this.surfaces.setOverlay(true);
    this.surfaces.setConstantScreenSize(true);

    // cleanup construction curves
    spinnerInner.destroy();
    spinnerOuter.destroy();
    planeMoverInner.destroy();
    planeMoverOuter.destroy();

  }

  public updatedSelection(): void {
    const selection: Set<ObjectID> = INSTANCE.getSelector().getSelection();
    if (selection.size === 0) {
      this.enabled = false;
      this.surfaces.hide();
    } else {
      this.enabled = true;
      this.surfaces.show();
      const selectionBB: BoundingBox = new BoundingBox();
      for (const id of selection) {
        const geo: Geometry = INSTANCE.getScene().getGeometry(id);
        selectionBB.addBoundingBox(geo.getBoundingBox());
      }
      this.originalModel = mat4.translate(mat4.identity(), selectionBB.getCenter());
      this.currentModel = mat4.clone(this.originalModel);
      this.surfaces.setModel(this.originalModel);
    }
  }

  public tick(): void {
    if (!this.enabled) return;
    const cameraPos: Vec3 = INSTANCE.getScene().getCamera().getPosition();
    const thisPos: Vec3 = mat4.getTranslation(this.originalModel);
    const dx: number = thisPos[0] - cameraPos[0];
    const dy: number = thisPos[1] - cameraPos[1];
    const dz: number = thisPos[2] - cameraPos[2];
    var flipper: Mat4 = mat4.scale(mat4.identity(), vec3.create(
      dx > 0 ? -1 : 1,
      dy > 0 ? -1 : 1,
      dz > 0 ? -1 : 1,
    ));
    this.xyPlaneMover.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.zSpinner.setModel(mat4.mul(flipper, Mover.toXYPlane));
    this.xzPlaneMover.setModel(mat4.mul(flipper, Mover.toXZPlane));
    this.ySpinner.setModel(mat4.mul(flipper, Mover.toXZPlane));
    this.yzPlaneMover.setModel(mat4.mul(flipper, Mover.toYZPlane));
    this.xSpinner.setModel(mat4.mul(flipper, Mover.toYZPlane));
  }

  private getTransform(): Mat4 {
    return mat4.mul(this.currentModel, mat4.inverse(this.originalModel));
  }

  public getSelectionTransformBuffer(): GPUBuffer {
    return this.transformBuffer;
  }



}
