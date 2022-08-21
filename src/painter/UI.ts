import Painter from "./Painter";
import MouseHandlers from "./MouseHandlers";

class UI {
  private painter: Painter;
  public table: HTMLTableElement;
  private mouseHandlers = new MouseHandlers(this);
  constructor(painter: Painter) {
    this.table = painter.getTableElement();
    this.painter = painter;
    this.mouseHandlers.bind();
  }

  public addWall(targetElement: HTMLTableCellElement) {
    this.painter.addWall(targetElement);
  }

  public toggleWall(targetElement: HTMLTableCellElement) {
    this.painter.toggleWall(targetElement);
  }

  public setGridStart(targetElement: HTMLTableCellElement) {
    this.painter.renderStartAtCell(targetElement);
  }

  public setGridEnd(targetElement: HTMLTableCellElement) {
    this.painter.renderEndAtCell(targetElement);
  }
}

export default UI;
