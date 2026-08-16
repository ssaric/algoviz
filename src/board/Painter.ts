import { cell, type Cell } from '../core/cell';
import { Grid } from '../core/Grid';
import { DEFAULT_HEURISTIC, type HeuristicSpec } from '../core/heuristics';
import type { SearchOutcome, Step, StepKind } from '../core/protocol';
import { PointerController, type BoardEditor } from './PointerController';
import { Timeline, type Direction, type TimelineState } from './Timeline';
import { WorkerClient } from './WorkerClient';

export const CELL_SIZE = 20;

/** How far the skip-forward / skip-back buttons jump. */
const SKIP_SIZE = 10;

export type BoardStatus = 'idle' | 'solving' | 'solved' | 'unreachable' | 'failed';

export type BoardState = TimelineState & {
  readonly status: BoardStatus;
  readonly message: string | null;
  readonly outcome: SearchOutcome | null;
  /** The step under the playhead, i.e. what the algorithm just did. */
  readonly currentStep: Step | null;
};

export type BoardListener = (state: BoardState) => void;

/** Steps that leave a lasting mark, and the class that draws it. */
const STEP_CLASS: Partial<Record<StepKind, string>> = {
  visit: 'cell--visited',
  discover: 'cell--discovered',
  path: 'cell--path'
};

const TRANSIENT_CLASSES = ['cell--visited', 'cell--discovered', 'cell--path'];

/**
 * Owns the board: the DOM table, the grid behind it, pointer editing, the
 * seekable timeline, and the conversation with the search worker.
 *
 * Deliberately free of any framework. State is published through `subscribe`,
 * which happens to satisfy Svelte's store contract, so a component can read it
 * without this class knowing Svelte exists.
 */
export class Painter implements BoardEditor {
  private readonly container: HTMLElement;
  private readonly grid: Grid;
  private readonly timeline: Timeline;
  private readonly worker: WorkerClient;
  private readonly pointer: PointerController;
  private readonly resizeObserver: ResizeObserver;
  private readonly listeners = new Set<BoardListener>();

  private cells: HTMLTableCellElement[][] = [];
  private highlighted: HTMLTableCellElement | null = null;
  private heuristic: HeuristicSpec = DEFAULT_HEURISTIC;
  private status: BoardStatus = 'idle';
  private message: string | null = null;
  private outcome: SearchOutcome | null = null;
  private autoPlay = false;

  constructor(container: HTMLElement) {
    this.container = container;

    const { width, height } = container.getBoundingClientRect();
    this.grid = new Grid({
      columns: Math.floor(width / CELL_SIZE),
      rows: Math.floor(height / CELL_SIZE)
    });

    this.timeline = new Timeline(this.drawStep);
    this.timeline.subscribe(() => this.publish());

    this.worker = new WorkerClient({
      onStarted: () => this.setStatus('solving'),
      onSteps: (steps) => this.receiveSteps(steps),
      onFinished: (outcome) => this.finish(outcome),
      onFailed: (message) => this.setStatus('failed', message)
    });

    this.pointer = new PointerController(container, this);

    this.renderBoard();
    this.pointer.bind();

    this.resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const columns = Math.floor(entry.contentRect.width / CELL_SIZE);
      const rows = Math.floor(entry.contentRect.height / CELL_SIZE);
      // Cells the timeline refers to may no longer exist after a reflow.
      if (this.grid.resize(columns, rows)) {
        this.resetVisualization();
        this.renderBoard();
      }
    });
    this.resizeObserver.observe(container);
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.pointer.unbind();
    this.worker.destroy();
    this.listeners.clear();
  }

  // -- state -----------------------------------------------------------------

  get state(): BoardState {
    return {
      ...this.timeline.state,
      status: this.status,
      message: this.message,
      outcome: this.outcome,
      currentStep: this.timeline.stepAtCursor
    };
  }

  subscribe(listener: BoardListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  // -- commands --------------------------------------------------------------

  /** Runs the search, or resumes playback if one has already been computed. */
  solve(): void {
    if (this.timeline.state.totalSteps > 0) {
      this.timeline.play();
      return;
    }
    if (!this.grid.isSolvable) {
      this.setStatus('failed', 'The board needs a start and an end cell.');
      return;
    }
    this.resetVisualization();
    this.autoPlay = true;
    this.setStatus('solving');
    this.worker.solve(this.grid.serialize(), this.heuristic);
  }

  play(): void {
    this.timeline.play();
  }

  pause(): void {
    this.autoPlay = false;
    this.timeline.pause();
  }

  seek(cursor: number): void {
    this.pause();
    this.timeline.seek(cursor);
  }

  skipForward(): void {
    this.pause();
    this.timeline.stepBy(SKIP_SIZE);
  }

  skipBackward(): void {
    this.pause();
    this.timeline.stepBy(-SKIP_SIZE);
  }

  setHeuristic(spec: HeuristicSpec): void {
    this.heuristic = spec;
    this.resetVisualization();
  }

  resetGrid(): void {
    this.grid.clearWalls();
    this.resetVisualization();
    this.renderStatics();
  }

  // -- BoardEditor -----------------------------------------------------------

  cellAt(target: EventTarget | null): Cell | null {
    if (!(target instanceof HTMLElement)) return null;
    const { x, y } = target.dataset;
    if (x === undefined || y === undefined) return null;
    return cell(Number(x), Number(y));
  }

  isWall(c: Cell): boolean {
    return this.grid.isWall(c);
  }

  isStart(c: Cell): boolean {
    return this.grid.isStart(c);
  }

  isEnd(c: Cell): boolean {
    return this.grid.isEnd(c);
  }

  setWall(c: Cell, present: boolean): void {
    if (present && !this.grid.isPlaceable(c)) return;
    if (!present && !this.grid.isWall(c)) return;

    this.discardStaleRun();
    if (present) this.grid.addWall(c);
    else this.grid.removeWall(c);
    this.element(c)?.classList.toggle('cell--wall', present);
  }

  moveStart(c: Cell): void {
    if (!this.grid.isPlaceable(c)) return;
    this.discardStaleRun();
    this.element(this.grid.start)?.classList.remove('cell--start');
    this.grid.setStart(c);
    this.element(c)?.classList.add('cell--start');
  }

  moveEnd(c: Cell): void {
    if (!this.grid.isPlaceable(c)) return;
    this.discardStaleRun();
    this.element(this.grid.end)?.classList.remove('cell--end');
    this.grid.setEnd(c);
    this.element(c)?.classList.add('cell--end');
  }

  // -- worker ----------------------------------------------------------------

  private receiveSteps(steps: readonly Step[]): void {
    this.timeline.append(steps);
    // Start playing as soon as there is something to show, and pick playback
    // back up if it drained the batches received so far while more were still
    // in flight. Cleared as soon as the user takes manual control.
    if (this.autoPlay && !this.timeline.state.isPlaying) this.timeline.play();
  }

  private finish(outcome: SearchOutcome): void {
    this.autoPlay = false;
    this.outcome = outcome;
    this.setStatus(
      outcome.found ? 'solved' : 'unreachable',
      outcome.found ? null : 'No path exists between the start and the end cell.'
    );
  }

  private setStatus(status: BoardStatus, message: string | null = null): void {
    this.status = status;
    this.message = message;
    this.publish();
  }

  /** Editing the board invalidates whatever the last search produced. */
  private discardStaleRun(): void {
    if (this.timeline.state.totalSteps === 0 && this.status === 'idle') return;
    this.worker.abandon();
    this.resetVisualization();
  }

  private resetVisualization(): void {
    this.autoPlay = false;
    this.timeline.clear();
    this.clearHighlight();
    this.outcome = null;
    for (const row of this.cells) {
      for (const element of row) element.classList.remove(...TRANSIENT_CLASSES);
    }
    this.setStatus('idle');
  }

  // -- rendering -------------------------------------------------------------

  private readonly drawStep = (step: Step, direction: Direction): void => {
    const className = STEP_CLASS[step.kind];
    if (!className) return; // 'reopen' and 'skip' are narration only
    this.element(step.cell)?.classList.toggle(className, direction === 'forward');
  };

  private publish(): void {
    this.trackPlayhead();
    const state = this.state;
    this.listeners.forEach((listener) => listener(state));
  }

  /** Outlines the cell the playhead is sitting on. */
  private trackPlayhead(): void {
    const target = this.timeline.stepAtCursor;
    const element = target ? this.element(target.cell) : null;
    if (element === this.highlighted) return;
    this.highlighted?.classList.remove('cell--highlighted');
    element?.classList.add('cell--highlighted');
    this.highlighted = element ?? null;
  }

  private clearHighlight(): void {
    this.highlighted?.classList.remove('cell--highlighted');
    this.highlighted = null;
  }

  private element(c: Cell): HTMLTableCellElement | null {
    return this.cells[c.y]?.[c.x] ?? null;
  }

  private renderBoard(): void {
    const table = document.createElement('table');
    table.className = 'table';
    const body = document.createElement('tbody');
    this.cells = [];

    for (let y = 0; y < this.grid.rows; y++) {
      const row = document.createElement('tr');
      const rowCells: HTMLTableCellElement[] = [];
      for (let x = 0; x < this.grid.columns; x++) {
        const td = document.createElement('td');
        td.className = 'cell';
        td.dataset.x = `${x}`;
        td.dataset.y = `${y}`;
        row.appendChild(td);
        rowCells.push(td);
      }
      body.appendChild(row);
      this.cells.push(rowCells);
    }

    table.appendChild(body);
    this.container.replaceChildren(table);
    this.renderStatics();
  }

  /** Paints the parts of the board that are not part of a search: the walls
   *  and the two markers. */
  private renderStatics(): void {
    for (const row of this.cells) {
      for (const element of row) element.classList.remove('cell--wall');
    }
    for (const wall of this.grid.wallList) this.element(wall)?.classList.add('cell--wall');
    this.element(this.grid.start)?.classList.add('cell--start');
    this.element(this.grid.end)?.classList.add('cell--end');
  }
}
