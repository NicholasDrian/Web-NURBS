


export class Timer {

    private startTime: number = 0;

    constructor() {
        this.reset();
    }

    public reset(): void {
        this.startTime = Date.now();
    }

    public logTime(): void {
        console.log((Date.now() - this.startTime) / 1000.0);
    }

    public getTime(): number {
        return (Date.now() - this.startTime) / 1000.0;
    }

}
