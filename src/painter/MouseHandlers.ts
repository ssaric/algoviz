import { MouseClick } from "../constants/types";
import type Painter from "./Painter";

class MouseHandlers {
  private painter: Painter;
  private dragSelect = false;
  private draggingStartCell = false;
  private draggingEndCell = false;

  private mouseDownCallback = this.onMouseDown.bind(this);
  private mouseMoveCallback = this.onMouseMove.bind(this);
  private mouseUpCallback = this.onMouseUp.bind(this);
  private mouseclickCallback = this.onMouseClick.bind(this);
  private mouseOutCallback = this.onMouseOut.bind(this);

  constructor(painter: Painter) {
    this.painter = painter;
  }
  public bind() {
    this.painter.container.addEventListener("mousedown", this.mouseDownCallback);
    this.painter.container.addEventListener("click", this.mouseclickCallback);
    this.painter.container.addEventListener("mouseup", this.mouseUpCallback);
    this.painter.container.addEventListener("mousemove", this.mouseMoveCallback);
  }

  public unbind() {
    this.painter.container.removeEventListener("click", this.mouseclickCallback);
    this.painter.container.removeEventListener("mousedown", this.mouseDownCallback);
    this.painter.container.removeEventListener("mouseup", this.mouseUpCallback);
    this.painter.container.removeEventListener("mousemove", this.mouseMoveCallback);
  }

  onMouseMove(e: MouseEvent) {
    if (!this.dragSelect && !this.draggingStartCell && !this.draggingEndCell)
      return;
    const target = e.target as HTMLElement;
    if (!target.getAttribute("columnIndex")) return;
    this.handleMovementEvent(e.target as HTMLTableCellElement);
  }

  handleMovementEvent(targetElement: HTMLTableCellElement) {
    if (this.draggingStartCell) {
      this.painter.renderStartAtCell(targetElement);
    } else if (this.draggingEndCell) {
      this.painter.renderEndAtCell(targetElement);
    }
    if (this.dragSelect) {
      this.painter.addWall(targetElement);
    }
  }

  onMouseClick(e: MouseEvent) {
    if (!e.target) return;
    if (!(e.target instanceof HTMLTableCellElement)) return;
    if (!e.target.getAttribute("columnIndex")) return;
    if (e.button !== MouseClick.LEFT) return;
    e.target.classList.toggle("cell--wall");
  }

  onMouseDown(e: MouseEvent) {
    if (!(e.target instanceof HTMLTableCellElement)) return;
    if (e.button !== undefined && e.button !== MouseClick.LEFT) return;
    this.painter.container.addEventListener("mouseout", this.mouseOutCallback);
    this.painter.container.addEventListener("touchcancel", this.mouseOutCallback);
    this.painter.container.addEventListener("mouseup", this.mouseUpCallback);
    if (e.target.classList.contains("cell--start"))
      this.draggingStartCell = true;
    else if (e.target.classList.contains("cell--end"))
      this.draggingEndCell = true;
    else this.dragSelect = true;
  }
  onMouseUp() {
    this.painter.container.removeEventListener("mouseout", this.mouseOutCallback);
    this.dragSelect = false;
    this.draggingStartCell = false;
    this.draggingEndCell = false;
  }
  onMouseOut(e: MouseEvent | TouchEvent) {
    const from = e.target;
    if (!from) {
      this.dragSelect = false;
    }
  }
}

export default MouseHandlers;
