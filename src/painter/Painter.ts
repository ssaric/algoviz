import Grid from "./Grid";
import {
  AlgorithmStep,
  AlgorithmWorkerStepType,
  CELL_SIZE,
  PlaybackDirection, GridPaintStroke, MessageType
} from "../constants/types";
import MouseHandlers from "./MouseHandlers";
import {get, writable, Writable} from "svelte/store";
import {heuristics} from "../store";
import { clamp } from ".";

const TABLE_ID = "table";
const STEP_SIZE = 10;



class Painter {
  public grid: Grid;
  public container: HTMLDivElement;
  public algorithmWorker: Worker | undefined = undefined;
  private mouseHandlers = new MouseHandlers(this);
  public _steps: Writable<Array<GridPaintStroke>> = writable([]);
  public _currentStep = writable(0);
  public _interval = writable<number | null>(null);

  constructor() {
    const root = document.getElementById("root") as HTMLDivElement;
    this.container = root;
    const rootBbox = root.getBoundingClientRect();
    const viewportWidth = rootBbox.width;
    const viewportHeight = rootBbox.height;
    const initialColumns = Math.floor(viewportWidth / CELL_SIZE);
    const initialRows = Math.floor(viewportHeight / CELL_SIZE);
    this.grid = new Grid({
      columns: initialColumns,
      rows: initialRows,
    });
    this.renderGrid();
    this.updateCellNumberListener();
    this.renderStarAndEndNodes();
  }
  public async loadWorker () {
    const AlgorithmWorker = await import('../worker/AlgorithmMincerWorker?worker');
    this.algorithmWorker = new AlgorithmWorker.default();
    this.algorithmWorker.onmessage = (e:  MessageEvent<any>) => {
      const data = e.data[1];
      switch (data.type) {
        case AlgorithmWorkerStepType.START:
          this.resetGrid();
          return;
        case AlgorithmWorkerStepType.INFO:
          break;
        default:
          this.addVisualizationStep(data);

      }
    };
  };

  public bindEventHandlers() {
    this.mouseHandlers.bind();
  }

  public unbindEventHandlers() {
    this.mouseHandlers.unbind();
  }

  get steps(): Array<GridPaintStroke> {
    return get(this._steps);
  }

  get interval(): number | null{
    return get(this._interval);
  }


  get currentStep() {
    return get(this._currentStep);
  }

  set currentStep(index: number) {
    this._currentStep.set(index);
  }

  get isPlaying(): boolean {
    return this.interval !== null;
  }

  get totalNumberOfSteps(): number {
    return this.steps.length;
  }

  private startProcessingData = () => {
    this.algorithmWorker?.postMessage([MessageType.GRID_DATA, {
      columns: this.grid.columns,
      rows: this.grid.rows,
      walls: this.grid.wallsAsArray,
      start: this.grid.startAsArray,
      end: this.grid.endAsArray,
      heuristics: get(heuristics),
    }]);
  };



  public startVisualizingSteps = () => {
    if (!this.canProcessData()) {
      // showMissingDataToast();
    } else if (this.totalNumberOfSteps === 0) {
      this.startProcessingData();
    } else {
      this.startPlaying();
    }
  };

  private canProcessData() {
    return this.grid.isGridValid();
  }

  private removeInterval() {
    this.interval && clearInterval(this.interval);
    this._interval.set(null);
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
      return tableCell;
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

  highlightElement(element: Element) {
    element.classList.add('cell--highlighted');
    setTimeout(() => element.classList.remove('cell--highlighted'), 200);
  }

  stepForward(element: Element, type: AlgorithmWorkerStepType) {
    this.highlightElement(element);
    switch (type) {
      case AlgorithmWorkerStepType.VISIT: {
        return element.classList.add('cell--visited');
      }
      case AlgorithmWorkerStepType.DISCOVER: {
        return element.classList.add('cell--discovered');
      }
      case AlgorithmWorkerStepType.MARK_PATH: {
        return element.classList.add('cell--path');
      }
    }
  }

  stepBackward(element: Element, type: AlgorithmWorkerStepType) {
    this.highlightElement(element);
    switch (type) {
      case AlgorithmWorkerStepType.VISIT: {
        return element.classList.remove('cell--visited');
      }
      case AlgorithmWorkerStepType.DISCOVER: {
        return element.classList.remove('cell--discovered');
      }
      case AlgorithmWorkerStepType.MARK_PATH: {
        return element.classList.remove('cell--path');
      }
    }
  }

  createGridPaintMove(element: Element, type: AlgorithmWorkerStepType, direction: PlaybackDirection) {
    switch (direction) {
      case PlaybackDirection.FORWARD:
        return this.stepForward(element, type);
      case PlaybackDirection.BACKWARD:
        return this.stepBackward(element, type);
    }
  }

  private queueForwardSteps(nrOfSteps = STEP_SIZE) {
    const start = this.currentStep;
    for (let i = start; i < start + nrOfSteps; i++) {
      setTimeout(() => this.steps[i](PlaybackDirection.FORWARD), 0);
    }
  }

  private queueBackwardsSteps(nrOfSteps = STEP_SIZE) {
    const start = this.currentStep;
    for (let i = start; i > start + nrOfSteps; i--) {
      setTimeout(() => {
        if (!this.steps[i]) debugger;
        this.steps[i](PlaybackDirection.BACKWARD);
      }, 0);
    }
  }

  public skipBackward = () => {
    const nrOfSteps = clamp(-STEP_SIZE, -this.currentStep, 0)
    this.queueBackwardsSteps(nrOfSteps);
    this.currentStep = this.currentStep + nrOfSteps;
  };

  public skipForward = () => {
    const nrOfSteps = clamp(STEP_SIZE, 0, (this.steps.length - 1) - this.currentStep)
    this.queueForwardSteps(nrOfSteps);
    this.currentStep = this.currentStep + nrOfSteps;
  };

  public onManualLoaderChange(e) {
    this.removeInterval();
    const value = parseInt(e.detail.target.value, 10);
    const nrOfSteps = value - this.currentStep;
    const direction = nrOfSteps > 0 ? PlaybackDirection.FORWARD : PlaybackDirection.BACKWARD;
    if (direction === PlaybackDirection.FORWARD) this.queueForwardSteps(nrOfSteps)
    else if (direction === PlaybackDirection.BACKWARD) this.queueBackwardsSteps(nrOfSteps);
    this.currentStep = value;
  };

  public stopPlaying  (){
    if (this.interval === null) return;
    clearInterval(this.interval);
    this._interval.set(null);
  };

  public startPlaying() {
    this._interval.set(window.setInterval(() => {
      if (this.currentStep >= this.totalNumberOfSteps - 1) {
        this.removeInterval();
        return;
      }
      const stepToExecute = this.steps[this.currentStep++];
      stepToExecute(PlaybackDirection.FORWARD);
    }, 20));
  }

  public addVisualizationStep(step: AlgorithmStep) {
      const { location, type } = step;
      if (!location) return;
      const element = this.getCell(location[0], location[1]);
      if (!element) return;
      this._steps.update(s => [...s, direction => this.createGridPaintMove(element, type, direction)]);
      if (!this.interval) this.startVisualizingSteps();
  }

  public resetGrid() {
    this._steps.set([]);
    this.currentStep = 0;
    const cells = this.container.querySelectorAll('td.cell--visited, td.cell--discovered, td.cell--path');
    [...cells].forEach(e => {
      e.classList.remove('cell--visited');
      e.classList.remove('cell--discovered');
      e.classList.remove('cell--path');
    });
  }

  adjustStartCell(
    targetElement: HTMLTableCellElement,
    columnIndex: number,
    rowIndex: number
  ): void {
    if (!targetElement.classList.contains("cell--start")) return;
    const newLocation = this.grid.nearestFreeCell(columnIndex, rowIndex);
    if (!newLocation) return;
    const [newColumnIndex, newRowIndex] = newLocation;
    const newStartCell = this.getCell(newColumnIndex, newRowIndex);
    if (!newStartCell) return;
    this.renderStartAtCell(newStartCell);
  }


  adjustEndCell(
    targetElement: HTMLTableCellElement,
    columnIndex: number,
    rowIndex: number
  ): void {
    if (!targetElement.classList.contains("cell--end")) return;
    const newLocation = this.grid.nearestFreeCell(columnIndex, rowIndex);
    if (!newLocation) return;
    const [newColumnIndex, newRowIndex] = newLocation;
    const newEndCell = this.getCell(newColumnIndex, newRowIndex);
    if (!newEndCell) return;
    this.renderEndAtCell(newEndCell);
  }

  addWall(targetElement: HTMLTableCellElement) {
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex") as string);
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex") as string);
    this.adjustStartCell(targetElement, columnIndex, rowIndex);
    this.adjustEndCell(targetElement, columnIndex, rowIndex);
    this.grid.addWall(columnIndex, rowIndex);
    this.renderWall(targetElement);
  }

  renderStartAtCell(targetElement: HTMLTableCellElement) {
    if (!this.grid.start) return;
    const startCell = this.getCell(
      this.grid.start.coordinates.x,
      this.grid.start.coordinates.y
    );
    startCell?.classList.remove("cell--start");
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex") as string);
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex") as string);
    this.grid.setStart(columnIndex, rowIndex);
    targetElement.classList.add("cell--start");
  }

  renderEndAtCell(targetElement: HTMLTableCellElement) {
    if (!this.grid.end) return;
    const endCell = this.getCell(
      this.grid.end.coordinates.x,
      this.grid.end.coordinates.y
    );
    endCell?.classList.remove("cell--end");
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex") as string);
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex") as string);
    this.grid.setEnd(columnIndex, rowIndex);
    targetElement.classList.add("cell--end");
  }

  toggleWall(targetElement: HTMLTableCellElement) {
    const columnIndex = parseInt(targetElement.getAttribute("columnIndex") as string);
    const rowIndex = parseInt(targetElement.getAttribute("rowIndex") as string);
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
    if (!this.grid.start) return;
    const startCell = this.getCell(
      this.grid.start.coordinates.x,
      this.grid.start.coordinates.y
    );
    if (!this.grid.end) return;
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
