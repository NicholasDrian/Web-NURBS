

export abstract class Command {

    abstract handleInput(intput: string): void;
    abstract handleClick(x: number, y: number): void;
    abstract handleMouseMove(x: number, y: number): void;
    abstract getInstructions(): string;
    abstract isFinished(): boolean;

}
