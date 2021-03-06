import { Controler } from "./controler";
import { Vector2 } from "../math/vector2";


const prev = new Vector2();
const mousePosition = new Vector2();
const v1 = new Vector2();

// interactor resposible for handle web event from an element
// and dispatch control event to controlers
export class Interactor{
  constructor(inputElement:HTMLElement) {
    this.inputElement = inputElement;
    this.bind();
  }

  enabled: boolean = true;
  mouseButton: number;
  inputElement: HTMLElement;

  controlers: Controler[] = [];

  private bind(): void {
    const el = this.inputElement;
    this.mouseButton = -1;
    el.addEventListener('mousemove', this.onMouseMove, false);
    el.addEventListener('mousedown', this.onMouseDown, false);
    el.addEventListener('mouseup', this.onMouseUp, false);
    el.addEventListener('mousewheel', this.onMouseWheel, false);
    // el.addEventListener('keydown', this.eventLoop, false);
    // el.addEventListener('keyup', this.cancelLoop, false);
    el.addEventListener('contextmenu', this.preventContentMenu, false);
  }
  private unbind(): void {
    const el = this.inputElement;
    this.mouseButton = -1;
    el.removeEventListener('mousemove', this.onMouseMove);
    el.removeEventListener('mousedown', this.onMouseDown);
    el.removeEventListener('mouseup', this.onMouseUp);
    el.removeEventListener('mousewheel', this.onMouseWheel);
    // el.removeEventListener('keydown', this.eventLoop);
    // el.removeEventListener('keyup', this.cancelLoop);
    el.removeEventListener('contextmenu', this.preventContentMenu, false);
  }

  private preventContentMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }
    mousePosition.set(event.clientX, event.clientY);
    v1.copy(prev).sub(mousePosition);
    if (this.mouseButton === 0) {
      this.groupEmit(this.leftMouseMoveCallBacks, v1);
    }
    if (this.mouseButton === 2) {
      this.groupEmit(this.rightMouseMoveCallBacks, v1);
    }
    prev.copy(mousePosition);
  }

  private onMouseDown = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }
    prev.set(event.clientX, event.clientY);
    this.mouseButton = event.button;
    event.preventDefault();
  }

  private onMouseUp = (event: MouseEvent) => {
    if (!this.enabled) {
      return;
    }
    this.groupEmit(this.mouseUpCallBacks);
    this.mouseButton = -1;
  }

  private onMouseWheel = (event: MouseWheelEvent) => {
    if (!this.enabled) {
      return;
    }
    let delta = 0;
    if ((event as any).wheelDelta !== void 0) {
      // WebKit / Opera / Explorer 9
      delta = (event as any).wheelDelta;
    } else if (event.deltaY !== void 0) {
      // Firefox
      delta = -event.deltaY;
    }
    delta = delta > 0 ? 1.1 : 0.9;
    this.groupEmit(this.mouseWheelCallBacks, delta);
  }

  private leftMouseMoveCallBacks = [];
  private rightMouseMoveCallBacks = [];
  private mouseWheelCallBacks = [];
  private mouseDownCallBacks = [];
  private mouseUpCallBacks = [];

  private groupEmit(callBackList, ...param) {
    callBackList.forEach(callback => {
      callback.callback(...param);
    });
  }
  private removeControler(controler, callBackList) {
    callBackList = callBackList.filter(callback => { return callback.controler === controler });
  }

  public bindLeftMouseMove(controler: Controler, callback: (offset: Vector2) => any) {
    this.leftMouseMoveCallBacks.push({controler, callback});
  }

  public bindRightMouseMove(controler: Controler, callback: (offset: Vector2) => any) {
    this.rightMouseMoveCallBacks.push({controler, callback});
  }

  public bindMouseWheel(controler: Controler, callback: (delta: number) => any) {
    this.mouseWheelCallBacks.push({controler, callback});
  }

  public bindMouseDown(controler: Controler, callback: () => any) {
    this.mouseDownCallBacks.push({controler, callback});
  }

  public bindMouseUp(controler: Controler, callback: () => any) {
    this.mouseUpCallBacks.push({controler, callback});
  }

  public unbindControlerAllListener(controler: Controler) {
    this.removeControler(this.mouseUpCallBacks, controler);
    this.removeControler(this.rightMouseMoveCallBacks, controler);
    this.removeControler(this.mouseWheelCallBacks, controler);
    this.removeControler(this.mouseDownCallBacks, controler);
    this.removeControler(this.mouseUpCallBacks, controler);
  }

  dispose() {
    this.unbind();
    this.leftMouseMoveCallBacks = [];
    this.rightMouseMoveCallBacks = [];
    this.mouseWheelCallBacks = [];
    this.mouseDownCallBacks = [];
    this.mouseUpCallBacks = [];
  }
}