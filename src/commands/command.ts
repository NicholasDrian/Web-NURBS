import { Vec3 } from "wgpu-matrix";
import { Intersection } from "../geometry/intersection";


export abstract class Command {

  abstract handleInputString(input: string): void;
  abstract handleClickResult(input: Intersection): void;
  abstract handleClick(): void;
  abstract handleMouseMove(): void;
  abstract getInstructions(): string;
  abstract isFinished(): boolean;

}
