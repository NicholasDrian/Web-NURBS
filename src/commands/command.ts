

export abstract class Command {

  abstract handleInput(input: string): void;
  abstract handleClick(): void;
  abstract handleMouseMove(): void;
  abstract getInstructions(): string;
  abstract isFinished(): boolean;

}
