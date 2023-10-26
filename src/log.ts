

export class Log {

  private logs: string;

  constructor() {
    this.logs = "<u>LOGS:</u>";
  }

  public log(text: string) {
    this.logs += "<br>" + text;
  }

  public getLogs(): string {
    return this.logs;
  }


}
