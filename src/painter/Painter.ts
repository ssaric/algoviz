import Grid from "./Grid";
import { CELL_SIZE } from "../constants/types";

const TABLE_ID = "table";

class Painter {
  public grid: Grid;
  public container: HTMLDivElement;

  constructor(grid: Grid, container: HTMLDivElement) {
    this.grid = grid;
    this.container = container;
    this.updateCellNumberListener();
    this.renderStarAndEndNodes();
  }

  updateCellNumberListener() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newColumns = Math.floor(entry.contentRect.width / CELL_SIZE);
        const newRows = Math.floor(entry.contentRect.height / CELL_SIZE);
        this.grid.updateColumns(newColumns);
        this.grid.updateRows(newRows);
        this.renderGrid();
        this.renderStarAndEndNodes();
      }
    });
    resizeObserver.observe(this.container);
  }

  createTableIfNotExist(): HTMLTableElement {
    const existingTable = this.getTableElement();
    if (!existingTable) {
      const table = document.createElement(TABLE_ID);
      table.id = "table";
      table.className = "table";
      this.container.appendChild(table);
      return table;
    }
    return existingTable;
  }

  createRowIfNotExist(
    table: HTMLTableElement,
    rowIndex: number
  ): HTMLTableRowElement {
    const existingRow = this.getRowElement(table, rowIndex);
    if (!existingRow) {
      const tableRow = document.createElement("tr");
      tableRow.setAttribute("rowIndex", `${rowIndex}`);
      table.appendChild(tableRow);
      return tableRow;
    }
    return existingRow;
  }

  createColumnIfNotExist(
    row: HTMLTableRowElement,
    rowIndex: number,
    columnIndex: number
  ): HTMLTableCellElement {
    const existingCell = this.getColumnElement(row, rowIndex, columnIndex);
    if (!existingCell) {
      const tableCell = document.createElement("td");
      tableCell.setAttribute("columnIndex", `${columnIndex}`);
      tableCell.setAttribute("rowIndex", `${rowIndex}`);
      tableCell.className = "cell";
      row.appendChild(tableCell);
    }
    return existingCell;
  }

  getTableElement(): HTMLTableElement {
    return document.getElementById(TABLE_ID) as HTMLTableElement;
  }

  getCell(columnIndex: number, rowIndex: number): HTMLTableCellElement | null {
    return document.querySelector(
      `td[rowIndex="${rowIndex}"][columnIndex="${columnIndex}"]`
    );
  }

  getRowElement(
    table: HTMLTableElement,
    rowIndex: number
  ): HTMLTableRowElement | null {
    return table.querySelector(
      `tr[rowIndex="${rowIndex}"]`
    ) as HTMLTableRowElement | null;
  }

  getColumnElement(
    row: HTMLTableRowElement,
    rowIndex: number,
    columnIndex: number
  ): HTMLTableCellElement | null {
    return row.querySelector(
      `td[rowIndex="${rowIndex}"][columnIndex="${columnIndex}"]`
    ) as HTMLTableCellElement | null;
  }

  getRenderedRows(table: HTMLTableElement): HTMLTableRowElement[] {
    return [...table.querySelectorAll("tr")];
  }

  getRenderedColumns(table: HTMLTableRowElement): HTMLTableCellElement[] {
    return [...table.querySelectorAll("td")];
  }

  adjustStartCell(
    targetElement: HTMLTableCellElement,
    columnIndex: number,
    rowIndex: number
  ): void {
    if (!targetElement.classList.contains("cell--start")) return;
    const newLocation = this.grid.nearestFreeCell(columnIndex, rowIndex);
    const [newColumnIndex, newRowIndex] = newLocation;
    const newStartCell = this.getCell(newColumnIndex, newRowIndex);
    this.renderStartAtCell(newStartCell);
  }

  adjustEndCell(
    targetElement: HTMLTableCellElement,
    columnIndex: number,
    rowIndex: number
  ): void {
    if (!targetElement.classList.contains("cell--end")) return;
    const newLocation = this.grid.nearestFreeCell(columnIndex, rowIndex);
    const [newColumnIndex, newRowIndex] = newLocation;
    const newStartCell = this.getCell(newColumnIndex, newRowIndex);
    this.renderEndAtCell(newStartCell);
  }

  addWall(targetElement: HTMLTableCellElement) {
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex"));
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex"));
    this.adjustStartCell(targetElement, columnIndex, rowIndex);
    this.adjustEndCell(targetElement, columnIndex, rowIndex);
    this.grid.addWall(columnIndex, rowIndex);
    this.renderWall(targetElement);
  }

  renderStartAtCell(targetElement: HTMLTableCellElement) {
    const startCell = this.getCell(
      this.grid.start.coordinates.x,
      this.grid.start.coordinates.y
    );
    startCell?.classList.remove("cell--start");
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex"));
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex"));
    this.grid.setStart(columnIndex, rowIndex);
    targetElement.classList.add("cell--start");
  }

  renderEndAtCell(targetElement: HTMLTableCellElement) {
    const endCell = this.getCell(
      this.grid.end.coordinates.x,
      this.grid.end.coordinates.y
    );
    endCell?.classList.remove("cell--end");
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex"));
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex"));
    this.grid.setEnd(columnIndex, rowIndex);
    targetElement.classList.add("cell--end");
  }

  toggleWall(targetElement: HTMLTableCellElement) {
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex"));
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex"));
    this.grid.toggleWall(rowIndex, columnIndex);
    this.renderToggleWall(targetElement);
  }

  renderToggleWall(targetElement: HTMLTableCellElement) {
    targetElement.classList.toggle("cell--wall");
  }

  renderWall(targetElement: HTMLTableCellElement) {
    targetElement.classList.add("cell--wall");
  }

  renderStarAndEndNodes() {
    const startCell = this.getCell(
      this.grid.start.coordinates.x,
      this.grid.start.coordinates.y
    );
    const endCell = this.getCell(
      this.grid.end.coordinates.x,
      this.grid.end.coordinates.y
    );
    startCell?.classList.add("cell--start");
    endCell?.classList.add("cell--end");
  }

  removeCellsOutOfViewPort(table: HTMLTableElement) {
    const existingRows = this.getRenderedRows(table);
    if (existingRows.length > this.grid.rows) {
      const rowsToRemove = existingRows.slice(this.grid.rows);
      rowsToRemove.forEach((r) => r.remove());
    }
  }

  renderNewCells(table: HTMLTableElement) {
    for (let i = 0; i < this.grid.rows; i++) {
      const tableRow = this.createRowIfNotExist(table, i);
      const existingColumns = this.getRenderedColumns(tableRow);
      if (existingColumns.length > this.grid.columns) {
        const columnsToRemove = existingColumns.slice(this.grid.columns);
        columnsToRemove.forEach((r) => r.remove());
      }
      for (let j = 0; j < this.grid.columns; j++) {
        this.createColumnIfNotExist(tableRow, i, j);
      }
    }
  }

  renderGrid() {
    const table = this.createTableIfNotExist();
    this.removeCellsOutOfViewPort(table);
    this.renderNewCells(table);
  }
}

export default Painter;
