import { INSTANCE } from "../cad";


class EventNode {

  private next: EventNode | null = null;

  constructor(
    private handle: Function
  ) { }

  public addNext(eventNode: EventNode): void {
    this.next = eventNode;
  }

  public getNext(): EventNode | null {
    return this.next;
  }

  public execute(): void {
    this.handle();
    INSTANCE.getEventQueue().eventComplete();
  }
}


export class EventQueue {

  private first: EventNode | null;
  private last: EventNode | null;

  constructor() {
    this.first = null;
    this.last = null;
  }

  public pushEvent(handle: Function): void {
    if (this.first === null) {
      this.first = new EventNode(handle);
      this.last = this.first;
      this.first.execute();
    } else {
      this.last!.addNext(new EventNode(handle));
      this.last = this.last!.getNext();
    }
  }

  public eventComplete(): void {
    this.first = this.first!.getNext();
    if (this.first === null) {
      this.last = null;
    } else {
      this.first.execute();
    }
  }


}
