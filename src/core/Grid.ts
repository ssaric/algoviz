import { cell, cellId, cellsEqual, type Cell, type CellId } from './cell';

export type SerializedGrid = {
  readonly columns: number;
  readonly rows: number;
  readonly start: Cell;
  readonly end: Cell;
  readonly walls: readonly Cell[];
};

export type GridInit = {
  columns: number;
  rows: number;
  start?: Cell;
  end?: Cell;
  walls?: readonly Cell[];
};

/**
 * Board geometry: dimensions, walls, and the start/end markers.
 *
 * Deliberately knows nothing about searching or rendering. A search tracks its
 * own visited set, and the Painter owns the DOM; both read this as the single
 * source of truth for what the board currently looks like.
 */
export class Grid {
  private _columns: number;
  private _rows: number;
  private _start: Cell;
  private _end: Cell;
  private readonly walls = new Set<CellId>();

  constructor(init: GridInit) {
    this._columns = Math.max(1, init.columns);
    this._rows = Math.max(1, init.rows);
    this._start = init.start ?? Grid.defaultStart(this._columns, this._rows);
    this._end = init.end ?? Grid.defaultEnd(this._columns, this._rows);
    init.walls?.forEach((w) => this.walls.add(cellId(w)));
  }

  static defaultStart(columns: number, rows: number): Cell {
    return cell(Math.floor(columns / 8), Math.floor(rows / 2));
  }

  static defaultEnd(columns: number, rows: number): Cell {
    return cell(Math.floor(columns * (7 / 8)), Math.floor(rows / 2));
  }

  get columns(): number {
    return this._columns;
  }

  get rows(): number {
    return this._rows;
  }

  get start(): Cell {
    return this._start;
  }

  get end(): Cell {
    return this._end;
  }

  get wallList(): Cell[] {
    return [...this.walls].map((id) => {
      const [x, y] = id.split(',');
      return cell(Number(x), Number(y));
    });
  }

  /** A search can run as soon as there is somewhere to start and finish. */
  get isSolvable(): boolean {
    return this.isInside(this._start) && this.isInside(this._end);
  }

  isInside(c: Cell): boolean {
    return c.x >= 0 && c.y >= 0 && c.x < this._columns && c.y < this._rows;
  }

  isWall(c: Cell): boolean {
    return this.walls.has(cellId(c));
  }

  isStart(c: Cell): boolean {
    return cellsEqual(c, this._start);
  }

  isEnd(c: Cell): boolean {
    return cellsEqual(c, this._end);
  }

  /**
   * Whether a wall or marker may be dropped here. Distinct from what a search
   * may walk over -- a search must be allowed to step onto the end cell.
   */
  isPlaceable(c: Cell): boolean {
    return this.isInside(c) && !this.isWall(c) && !this.isStart(c) && !this.isEnd(c);
  }

  addWall(c: Cell): void {
    if (this.isInside(c)) this.walls.add(cellId(c));
  }

  removeWall(c: Cell): void {
    this.walls.delete(cellId(c));
  }

  clearWalls(): void {
    this.walls.clear();
  }

  setStart(c: Cell): void {
    if (this.isInside(c)) this._start = c;
  }

  setEnd(c: Cell): void {
    if (this.isInside(c)) this._end = c;
  }

  /** Orthogonal neighbours a search may consider: on the board and not a wall. */
  neighbours(c: Cell): Cell[] {
    const candidates = [
      cell(c.x, c.y - 1),
      cell(c.x, c.y + 1),
      cell(c.x + 1, c.y),
      cell(c.x - 1, c.y)
    ];
    return candidates.filter((n) => this.isInside(n) && !this.isWall(n));
  }

  /**
   * Breadth-first walk outwards to the closest cell that can hold a marker.
   * Used when a wall is painted over the start or end node.
   */
  nearestPlaceable(from: Cell): Cell | null {
    const seen = new Set<CellId>([cellId(from)]);
    const queue: Cell[] = [from];

    while (queue.length > 0) {
      const current = queue.shift() as Cell;
      if (!cellsEqual(current, from) && this.isPlaceable(current)) return current;

      for (const next of [
        cell(current.x, current.y - 1),
        cell(current.x, current.y + 1),
        cell(current.x + 1, current.y),
        cell(current.x - 1, current.y)
      ]) {
        const id = cellId(next);
        if (seen.has(id) || !this.isInside(next)) continue;
        seen.add(id);
        queue.push(next);
      }
    }
    return null;
  }

  /**
   * Fit to a new viewport. Markers are pulled back inside the new bounds and
   * walls that fell off the board are dropped. Returns whether anything moved,
   * so the caller can skip a re-render.
   */
  resize(columns: number, rows: number): boolean {
    const nextColumns = Math.max(1, columns);
    const nextRows = Math.max(1, rows);
    if (nextColumns === this._columns && nextRows === this._rows) return false;

    this._columns = nextColumns;
    this._rows = nextRows;

    const clamp = (c: Cell): Cell =>
      cell(Math.min(c.x, nextColumns - 1), Math.min(c.y, nextRows - 1));
    this._start = clamp(this._start);
    this._end = clamp(this._end);

    for (const id of [...this.walls]) {
      const [x, y] = id.split(',');
      if (!this.isInside(cell(Number(x), Number(y)))) this.walls.delete(id);
    }
    return true;
  }

  serialize(): SerializedGrid {
    return {
      columns: this._columns,
      rows: this._rows,
      start: this._start,
      end: this._end,
      walls: this.wallList
    };
  }
}
