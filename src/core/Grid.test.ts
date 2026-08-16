import { describe, expect, it } from 'vitest';
import { Grid } from './Grid';
import { cell } from './cell';

const sortCells = (cells: { x: number; y: number }[]) =>
  [...cells].sort((a, b) => a.x - b.x || a.y - b.y);

describe('construction', () => {
  it('places start and end at the default positions when none are given', () => {
    const grid = new Grid({ columns: 80, rows: 40 });

    expect(grid.start).toEqual(cell(10, 20));
    expect(grid.end).toEqual(cell(70, 20));
  });

  it('honours explicit start, end and walls', () => {
    const grid = new Grid({
      columns: 10,
      rows: 10,
      start: cell(0, 0),
      end: cell(9, 9),
      walls: [cell(5, 5)]
    });

    expect(grid.start).toEqual(cell(0, 0));
    expect(grid.end).toEqual(cell(9, 9));
    expect(grid.wallList).toEqual([cell(5, 5)]);
  });
});

describe('cell classification', () => {
  const grid = new Grid({
    columns: 5,
    rows: 5,
    start: cell(0, 0),
    end: cell(4, 4),
    walls: [cell(2, 2)]
  });

  it('rejects coordinates outside the board', () => {
    expect(grid.isInside(cell(-1, 0))).toBe(false);
    expect(grid.isInside(cell(0, -1))).toBe(false);
    expect(grid.isInside(cell(5, 0))).toBe(false);
    expect(grid.isInside(cell(0, 5))).toBe(false);
    expect(grid.isInside(cell(4, 4))).toBe(true);
  });

  // The old model compared a GridCoordinates against a GridNode through an
  // instanceof check, so these silently returned false.
  it('identifies start and end from plain coordinates', () => {
    expect(grid.isStart(cell(0, 0))).toBe(true);
    expect(grid.isEnd(cell(4, 4))).toBe(true);
    expect(grid.isStart(cell(1, 1))).toBe(false);
  });

  it('refuses to place anything on a wall, the start or the end', () => {
    expect(grid.isPlaceable(cell(2, 2))).toBe(false);
    expect(grid.isPlaceable(cell(0, 0))).toBe(false);
    expect(grid.isPlaceable(cell(4, 4))).toBe(false);
    expect(grid.isPlaceable(cell(1, 3))).toBe(true);
  });

  // A search has to be allowed to step onto the goal, which is exactly why
  // "can walk here" and "can build here" cannot be the same predicate.
  it('still lets a search walk onto the end cell', () => {
    expect(grid.neighbours(cell(3, 4))).toContainEqual(cell(4, 4));
  });
});

describe('walls', () => {
  it('can be added, removed and cleared', () => {
    const grid = new Grid({ columns: 5, rows: 5, start: cell(0, 0), end: cell(4, 4) });

    grid.addWall(cell(1, 1));
    expect(grid.isWall(cell(1, 1))).toBe(true);

    grid.removeWall(cell(1, 1));
    expect(grid.isWall(cell(1, 1))).toBe(false);

    grid.addWall(cell(2, 2));
    grid.clearWalls();
    expect(grid.wallList).toEqual([]);
  });

  it('cannot be built outside the board', () => {
    const grid = new Grid({ columns: 5, rows: 5 });

    grid.addWall(cell(9, 9));

    expect(grid.wallList).toEqual([]);
  });
});

describe('neighbours', () => {
  it('skips walls and the edges of the board', () => {
    const grid = new Grid({
      columns: 5,
      rows: 5,
      start: cell(0, 4),
      end: cell(4, 0),
      walls: [cell(2, 1)]
    });

    expect(sortCells(grid.neighbours(cell(2, 2)))).toEqual([cell(1, 2), cell(2, 3), cell(3, 2)]);
    expect(sortCells(grid.neighbours(cell(0, 0)))).toEqual([cell(0, 1), cell(1, 0)]);
  });
});

describe('nearestPlaceable', () => {
  it('returns an adjacent cell when one is free', () => {
    const grid = new Grid({ columns: 5, rows: 5, start: cell(0, 0), end: cell(4, 4) });

    const found = grid.nearestPlaceable(cell(2, 2));

    expect(found).not.toBeNull();
    expect(Math.abs(found!.x - 2) + Math.abs(found!.y - 2)).toBe(1);
  });

  it('escapes a fully enclosed cell', () => {
    const grid = new Grid({
      columns: 5,
      rows: 5,
      start: cell(0, 0),
      end: cell(4, 4),
      walls: [cell(1, 2), cell(3, 2), cell(2, 1), cell(2, 3)]
    });

    const found = grid.nearestPlaceable(cell(2, 2));

    expect(found).not.toBeNull();
    expect(grid.isPlaceable(found!)).toBe(true);
  });

  it('gives up when the whole board is occupied', () => {
    const walls = [];
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) walls.push(cell(x, y));
    const grid = new Grid({ columns: 3, rows: 3, start: cell(0, 0), end: cell(2, 2), walls });

    expect(grid.nearestPlaceable(cell(1, 1))).toBeNull();
  });
});

describe('resize', () => {
  it('reports when nothing changed', () => {
    const grid = new Grid({ columns: 10, rows: 10 });

    expect(grid.resize(10, 10)).toBe(false);
    expect(grid.resize(8, 10)).toBe(true);
  });

  it('pulls markers back inside the new bounds', () => {
    const grid = new Grid({ columns: 10, rows: 10, start: cell(9, 9), end: cell(8, 8) });

    grid.resize(5, 5);

    expect(grid.start).toEqual(cell(4, 4));
    expect(grid.end).toEqual(cell(4, 4));
    expect(grid.isInside(grid.start)).toBe(true);
  });

  it('drops walls that fell off the board', () => {
    const grid = new Grid({ columns: 10, rows: 10, walls: [cell(1, 1), cell(9, 9)] });

    grid.resize(5, 5);

    expect(grid.wallList).toEqual([cell(1, 1)]);
  });
});
