import { ALGORITHMS, DEFAULT_ALGORITHM, type AlgorithmId } from '../core/algorithms';
import { cell, cellId, type Cell, type CellId } from '../core/cell';
import { Grid, type SerializedGrid } from '../core/Grid';
import {
  DEFAULT_HEURISTIC,
  heuristicPull,
  type HeuristicPull,
  type HeuristicSpec
} from '../core/heuristics';
import { frontierAt as reconstructFrontier, type FrontierEntry } from '../core/frontier';
import type { SearchOutcome, SearchStats, Step, StepKind } from '../core/protocol';
import { statsAt as reconstructStats } from '../core/stats';
import { PointerController, type BoardEditor } from './PointerController';
import { Timeline, type Direction, type TimelineState } from './Timeline';
import { WorkerClient } from './WorkerClient';

export const CELL_SIZE = 20;

/** Preset boards are fixed size, so their cells shrink to fit the panel. */
const MIN_CELL_SIZE = 7;

/** How far the skip-forward / skip-back buttons jump. */
const SKIP_SIZE = 10;

export type PainterOptions = {
  /** A fixed board. When omitted the grid is sized from the container, which
   *  is what the sandbox wants; a lesson needs the exact layout it authored. */
  readonly board?: SerializedGrid;
  /** Whether the pointer may edit the board. Hover inspection stays on either
   *  way -- reading a preset board is the entire point of one. */
  readonly editable?: boolean;
  /** Whether the board starts playing itself as steps arrive. Off when an
   *  outside clock drives several boards in step. */
  readonly autoPlay?: boolean;
};

export type BoardStatus = 'idle' | 'solving' | 'solved' | 'unreachable' | 'failed';

/** Where a popup should sit, in viewport coordinates. */
export type AnchorRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/** One thing the search did to a cell, and when in the run it happened. */
export type InspectedEvent = {
  /** Position in the timeline, so "when" is answerable, not just "what". */
  readonly index: number;
  readonly step: Step;
};

/** What the algorithm thought about one cell, up to where the playhead is. */
export type CellInspection = {
  readonly cell: Cell;
  readonly anchor: AnchorRect;
  readonly algorithm: AlgorithmId;
  readonly heuristic: HeuristicSpec;
  /** Signed offset from this cell to the goal: the inputs a heuristic sees. */
  readonly delta: { readonly dx: number; readonly dy: number };
  readonly totalSteps: number;
  /** How hard the heuristic leans on this cell; null when there is none. */
  readonly pull: HeuristicPull | null;
  /** 1-based position on the frontier right now, or null once it has been
   *  expanded (or was never on it in the first place). Ties the popup back to
   *  the same queue the frontier panel shows -- rank 1 is what gets checked
   *  next. */
  readonly queueRank: number | null;
  readonly events: readonly InspectedEvent[];
};

export type BoardState = TimelineState & {
  readonly status: BoardStatus;
  readonly message: string | null;
  readonly outcome: SearchOutcome | null;
  /** The step under the playhead, i.e. what the algorithm just did. */
  readonly currentStep: Step | null;
  readonly inspection: CellInspection | null;
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

  private readonly editable: boolean;
  private readonly autoPlayWanted: boolean;
  private readonly fixedBoard: SerializedGrid | null;
  private cellSize = CELL_SIZE;
  private table: HTMLTableElement | null = null;
  private cells: HTMLTableCellElement[][] = [];
  private highlighted: HTMLTableCellElement | null = null;
  private algorithm: AlgorithmId = DEFAULT_ALGORITHM;
  private heuristic: HeuristicSpec = DEFAULT_HEURISTIC;
  private status: BoardStatus = 'idle';
  private message: string | null = null;
  private outcome: SearchOutcome | null = null;
  private autoPlay = false;
  /** Indices into the timeline, per cell, so a hover can answer "what did the
   *  algorithm think here?" without scanning the whole history. */
  private stepsByCell = new Map<CellId, number[]>();
  private inspected: { cell: Cell; anchor: AnchorRect } | null = null;

  constructor(container: HTMLElement, options: PainterOptions = {}) {
    this.container = container;
    this.editable = options.editable ?? true;
    this.autoPlayWanted = options.autoPlay ?? true;
    this.fixedBoard = options.board ?? null;

    const { width, height } = container.getBoundingClientRect();
    this.grid = this.fixedBoard
      ? new Grid({ ...this.fixedBoard, walls: [...this.fixedBoard.walls] })
      : new Grid({
          columns: Math.floor(width / CELL_SIZE),
          rows: Math.floor(height / CELL_SIZE)
        });
    this.fitCellSize(width, height);

    this.timeline = new Timeline(this.drawStep);
    this.timeline.subscribe(() => this.publish());

    this.worker = new WorkerClient({
      onStarted: () => this.setStatus('solving'),
      onSteps: (steps) => this.receiveSteps(steps),
      onFinished: (outcome) => this.finish(outcome),
      onFailed: (message) => this.setStatus('failed', message)
    });

    this.pointer = new PointerController(container, this, this.editable);

    this.renderBoard();
    this.pointer.bind();

    this.resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width: w, height: h } = entry.contentRect;

      if (this.fixedBoard) {
        // The layout is fixed; only the scale of it follows the panel.
        if (this.fitCellSize(w, h)) this.applyCellSize();
        return;
      }
      // Cells the timeline refers to may no longer exist after a reflow.
      if (this.grid.resize(Math.floor(w / CELL_SIZE), Math.floor(h / CELL_SIZE))) {
        this.resetVisualization();
        this.renderBoard();
      }
    });
    this.resizeObserver.observe(container);
  }

  /** Returns whether the scale changed. */
  private fitCellSize(width: number, height: number): boolean {
    if (!this.fixedBoard) return false;
    const fitted = Math.max(
      MIN_CELL_SIZE,
      Math.min(
        CELL_SIZE,
        Math.floor(width / this.grid.columns),
        Math.floor(height / this.grid.rows)
      )
    );
    if (fitted === this.cellSize) return false;
    this.cellSize = fitted;
    return true;
  }

  private applyCellSize(): void {
    this.table?.style.setProperty('--cell-size', `${this.cellSize}px`);
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
      currentStep: this.timeline.stepAtCursor,
      inspection: this.buildInspection()
    };
  }

  /** Only the steps the playhead has actually reached: hovering a cell must
   *  reveal what the algorithm has done so far, not spoil what comes next. */
  private buildInspection(): CellInspection | null {
    if (!this.inspected) return null;
    const { cell: target, anchor } = this.inspected;
    const indices = this.stepsByCell.get(cellId(target)) ?? [];
    const { cursor, totalSteps } = this.timeline.state;

    const events = indices
      .filter((index) => index < cursor)
      .map((index) => ({ index, step: this.timeline.stepAt(index) }))
      .filter((event): event is InspectedEvent => event.step !== null);

    if (events.length === 0) return null;

    const targetId = cellId(target);
    const rank = this.frontierAt(cursor).findIndex((entry) => cellId(entry.cell) === targetId);

    return {
      cell: target,
      anchor,
      algorithm: this.algorithm,
      heuristic: this.heuristic,
      delta: { dx: target.x - this.grid.end.x, dy: target.y - this.grid.end.y },
      totalSteps,
      pull: ALGORITHMS[this.algorithm].usesHeuristic
        ? heuristicPull(this.heuristic, target, this.grid.end)
        : null,
      queueRank: rank === -1 ? null : rank + 1,
      events
    };
  }

  /**
   * The priority queue's contents as of a given point in the timeline.
   *
   * Deliberately not part of `BoardState`: it replays the full history up to
   * `cursor`, which is trivial for a lesson-sized board but would recompute
   * needlessly on every published state for boards nobody is asking about it
   * for -- Sandbox included, which can be arbitrarily large.
   */
  frontierAt(cursor: number): readonly FrontierEntry[] {
    return reconstructFrontier(this.timeline.knownSteps, cursor);
  }

  /**
   * Expanded/discovered/path counts as of a given point in the timeline, so a
   * "cells expanded" figure reflects where the scrubber actually is rather
   * than sitting frozen at the final total until the run completes.
   */
  statsAt(cursor: number): SearchStats {
    return reconstructStats(this.timeline.knownSteps, cursor);
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
    this.autoPlay = this.autoPlayWanted;
    this.setStatus('solving');
    this.worker.solve(this.grid.serialize(), this.algorithm, this.heuristic);
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

  /** Moves the playhead by an arbitrary number of steps, positive or
   *  negative. `skipForward`/`skipBackward` are just this at a fixed size. */
  stepBy(delta: number): void {
    this.pause();
    this.timeline.stepBy(delta);
  }

  skipForward(): void {
    this.stepBy(SKIP_SIZE);
  }

  skipBackward(): void {
    this.stepBy(-SKIP_SIZE);
  }

  setAlgorithm(id: AlgorithmId): void {
    if (id === this.algorithm) return;
    this.algorithm = id;
    this.resetVisualization();
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

  inspect(c: Cell | null): void {
    // Nothing to explain until a search has produced something.
    if (this.stepsByCell.size === 0) c = null;
    if (c === null) {
      if (this.inspected === null) return;
      this.inspected = null;
      this.publish();
      return;
    }
    if (this.inspected && cellId(this.inspected.cell) === cellId(c)) return;

    const element = this.element(c);
    if (!element) return;
    const { left, top, width, height } = element.getBoundingClientRect();
    this.inspected = { cell: c, anchor: { left, top, width, height } };
    this.publish();
  }

  // -- worker ----------------------------------------------------------------

  private receiveSteps(steps: readonly Step[]): void {
    let index = this.timeline.state.totalSteps;
    for (const step of steps) {
      const id = cellId(step.cell);
      const existing = this.stepsByCell.get(id);
      if (existing) existing.push(index);
      else this.stepsByCell.set(id, [index]);
      index++;
    }
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
    this.stepsByCell.clear();
    this.inspected = null;
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
    table.className = this.editable ? 'table' : 'table table--static';
    table.style.setProperty('--cell-size', `${this.cellSize}px`);
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
    this.table = table;
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
