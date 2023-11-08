import { mat4, Mat4, vec3, Vec3, vec4 } from "wgpu-matrix";
import { INSTANCE } from "../cad";
import { createArc } from "../geometry/nurbs/arc";
import { Curve } from "../geometry/nurbs/curve";
import { loft } from "../geometry/nurbs/loft";
import { Surface } from "../geometry/nurbs/surface";

export class Mover {

  private originalModel: Mat4;
  private currentModel: Mat4;
  private enabled: boolean;

  constructor() {
    this.originalModel = mat4.identity();
    this.currentModel = mat4.identity();
    this.enabled = false;
    this.currentModel = this.originalModel;
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

    // create xy plane surfaces
    const xyPlaneMover: Surface = loft([planeMoverInner, planeMoverOuter], 1);
    xyPlaneMover.setMaterial("blue");
    const zSpinner: Surface = loft([spinnerInner, spinnerOuter], 1);
    zSpinner.setMaterial("blue");
    INSTANCE.getScene().addGeometry(xyPlaneMover);
    INSTANCE.getScene().addGeometry(zSpinner);

    // move construction lines
    planeMoverInner.setModel(mat4.rotateX(mat4.identity(), Math.PI / 2));
    planeMoverOuter.setModel(mat4.rotateX(mat4.identity(), Math.PI / 2));
    spinnerInner.setModel(mat4.rotateX(mat4.identity(), Math.PI / 2));
    spinnerOuter.setModel(mat4.rotateX(mat4.identity(), Math.PI / 2));

    // create xz plane surfaces
    const xzPlaneMover: Surface = loft([planeMoverInner, planeMoverOuter], 1);
    xzPlaneMover.setMaterial("green");
    const ySpinner: Surface = loft([spinnerInner, spinnerOuter], 1);
    ySpinner.setMaterial("green");
    INSTANCE.getScene().addGeometry(xzPlaneMover);
    INSTANCE.getScene().addGeometry(ySpinner);

    // move construction lines
    planeMoverInner.setModel(mat4.rotateY(mat4.identity(), Math.PI / -2));
    planeMoverOuter.setModel(mat4.rotateY(mat4.identity(), Math.PI / -2));
    spinnerInner.setModel(mat4.rotateY(mat4.identity(), Math.PI / -2));
    spinnerOuter.setModel(mat4.rotateY(mat4.identity(), Math.PI / -2));

    // create yz plane surfaces
    const yzPlaneMover: Surface = loft([planeMoverInner, planeMoverOuter], 1);
    yzPlaneMover.setMaterial("red");
    const xSpinner: Surface = loft([spinnerInner, spinnerOuter], 1);
    xSpinner.setMaterial("red");
    console.log(xSpinner.getColor());
    INSTANCE.getScene().addGeometry(yzPlaneMover);
    INSTANCE.getScene().addGeometry(xSpinner);

    // clean up
    spinnerInner.destroy();
    spinnerOuter.destroy();
    planeMoverInner.destroy();
    planeMoverOuter.destroy();

  }

  public init(position: Vec3): void {
    throw new Error("todo");
  }

  public mouseDown(id: number): void {
    throw new Error("todo");
  }

  public mouseUp(): void {
    throw new Error("todo");
  }

  public mouseMove(): void {
    const cameraPos: Vec3 = INSTANCE.getScene().getCamera().getPosition();
  }

  public show(): void {

  }

  public hide(): void {

  }

  public getTransform(): Mat4 {
    return mat4.mul(this.currentModel, mat4.inverse(this.originalModel));
  }



}
