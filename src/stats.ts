
export class RenderStats {

    private element: HTMLDivElement;
    private renderTime!: number;
    private frameTime!: number;
    private sceneTime!: number;
    private framesOver100ms!: number;
    private totalFrames!: number;
    private startTime!: number;

    constructor() {

        this.element = <HTMLDivElement> document.getElementById("stats");
        this.reset();
    }

    public reset(): void {

        this.renderTime = NaN;
        this.frameTime = NaN;
        this.sceneTime = NaN;
        this.framesOver100ms = 0;
        this.totalFrames = 0;
        this.startTime = Date.now();
    }

    public setRenderTime(renderTime: number): void {
        this.renderTime = renderTime;
    }

    public setFrameTime(frameTime: number): void {
        this.totalFrames++;
        if (frameTime > 0.1) this.framesOver100ms++;
        this.frameTime = frameTime;
    }

    public setSceneTime(sceneTime: number): void {
        this.sceneTime = sceneTime;
    }

    public render(): void {
        this.element.innerText =
            "FPS: " + (1.0 / this.frameTime).toFixed(3) + "\n" +
            "Average FPS: " + (1000.0 * this.totalFrames / (Date.now() - this.startTime)).toFixed(3) + "\n" +
            "\n" +
            "Render Time: " + this.renderTime.toFixed(3) + "\n" +
            "Frame Time: " + this.frameTime.toFixed(3) + "\n" +
            "Scene Time: " + this.sceneTime.toFixed(3) + "\n" +
            "\n" +
            "Frames Over 100ms: " + this.framesOver100ms.toString();
    }


};

