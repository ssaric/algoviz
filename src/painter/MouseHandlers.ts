import { MouseClick } from "../constants/types";
import UI from "./UI";

class MouseHandlers {
  private ui: UI;
  private dragSelect = false;
  private draggingStartCell = false;
  private draggingEndCell = false;

  private mouseDownCallback = this.onMouseDown.bind(this);
  private mouseMoveCallback = this.onMouseMove.bind(this);
  private mouseUpCallback = this.onMouseUp.bind(this);
  private mouseclickCallback = this.onMouseClick.bind(this);
  private mouseOutCallback = this.onMouseOut.bind(this);

  constructor(ui: UI) {
    this.ui = ui;
  }
  public bind() {
    this.ui.table.addEventListener("mousedown", this.mouseDownCallback);
    this.ui.table.addEventListener("click", this.mouseclickCallback);
    this.ui.table.addEventListener("mouseup", this.mouseUpCallback);
    this.ui.table.addEventListener("mousemove", this.mouseMoveCallback);
  }

  public unbind() {
    this.ui.table.removeEventListener("click", this.mouseclickCallback);
    this.ui.table.removeEventListener("mousedown", this.mouseDownCallback);
    this.ui.table.removeEventListener("mouseup", this.mouseUpCallback);
    this.ui.table.removeEventListener("mousemove", this.mouseMoveCallback);
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
      this.ui.setGridStart(targetElement);
    } else if (this.draggingEndCell) {
      this.ui.setGridEnd(targetElement);
    }
    if (this.dragSelect) {
      this.ui.addWall(targetElement);
    }
  }

  onMouseClick(e) {
    if (!e.target) return;
    if (!e.target.getAttribute("columnIndex")) return;
    if (e.button !== MouseClick.LEFT) return;
    e.target.classList.toggle("cell--wall");
  }

  onMouseDown(e) {
    if (e.button !== undefined && e.button !== MouseClick.LEFT) return;
    this.ui.table.addEventListener("mouseout", this.mouseOutCallback);
    this.ui.table.addEventListener("touchcancel", this.mouseOutCallback);
    this.ui.table.addEventListener("mouseup", this.mouseUpCallback);
    if (e.target.classList.contains("cell--start"))
      this.draggingStartCell = true;
    else if (e.target.classList.contains("cell--end"))
      this.draggingEndCell = true;
    else this.dragSelect = true;
  }
  onMouseUp() {
    this.ui.table.removeEventListener("mouseout", this.mouseOutCallback);
    this.dragSelect = false;
    this.draggingStartCell = false;
    this.draggingEndCell = false;
  }
  onMouseOut(e) {
    const from = e.relatedTarget;
    if (!from || from.nodeName === "HTML") {
      this.dragSelect = false;
    }
  }
}

export default MouseHandlers;
