import { describe, expect, it } from 'vitest';
import Grid, { setHeuristicsFunction } from './Grid';
import GridNode, { GridCoordinates } from './GridNode';
import { Heuristics } from '../constants/types';

const at = (x: number, y: number) => new GridCoordinates(x, y);
const node = (x: number, y: number) => new GridNode(at(x, y));

describe('Grid construction', () => {
  it('places start and end at the default thirds when none are given', () => {
    const grid = new Grid({ columns: 80, rows: 40 });

    expect(grid.startAsArray).toEqual([10, 20]);
    expect(grid.endAsArray).toEqual([70, 20]);
  });

  it('honours explicit start, end and walls', () => {
    const grid = new Grid({
      columns: 10,
      rows: 10,
      start: at(0, 0),
      end: at(9, 9),
      walls: [at(5, 5)]
    });

    expect(grid.startAsArray).toEqual([0, 0]);
    expect(grid.endAsArray).toEqual([9, 9]);
    expect(grid.wallsAsArray).toEqual([[5, 5]]);
  });
});

describe('cell classification', () => {
  const grid = new Grid({
    columns: 5,
    rows: 5,
    start: at(0, 0),
    end: at(4, 4),
    walls: [at(2, 2)]
  });

  it('rejects coordinates outside the grid', () => {
    expect(grid.isWithinGridBounds(at(-1, 0))).toBe(false);
    expect(grid.isWithinGridBounds(at(0, -1))).toBe(false);
    expect(grid.isWithinGridBounds(at(5, 0))).toBe(false);
    expect(grid.isWithinGridBounds(at(0, 5))).toBe(false);
    expect(grid.isWithinGridBounds(at(4, 4))).toBe(true);
  });

  it('treats walls as occupied and empty cells as free', () => {
    expect(grid.isCellFree(at(2, 2))).toBe(false);
    expect(grid.isCellFree(at(1, 3))).toBe(true);
  });

  it('recognises start and end when asked with a GridNode', () => {
    expect(grid.isStart(node(0, 0))).toBe(true);
    expect(grid.isEnd(node(4, 4))).toBe(true);
  });

  // Characterisation test, not an endorsement. isStart/isEnd compare through
  // GridCoordinates.equals, which instanceof-checks its argument -- but
  // grid.start/grid.end are GridNodes, so the check silently fails and bare
  // coordinates never match. getWalkableNeighbours currently depends on this:
  // if isCellFree really did exclude the end cell, the search could never
  // reach the goal. Untangling the two meanings of "free" belongs with the
  // Painter/Grid split, not here.
  it('KNOWN BUG: does not recognise start/end from bare coordinates', () => {
    expect(grid.isStart(at(0, 0))).toBe(false);
    expect(grid.isEnd(at(4, 4))).toBe(false);
    expect(grid.isCellFree(at(0, 0))).toBe(true);
  });
});

describe('walls', () => {
  it('can be added and removed', () => {
    const grid = new Grid({ columns: 5, rows: 5, start: at(0, 0), end: at(4, 4) });

    grid.addWall(1, 1);
    expect(grid.isWall(at(1, 1))).toBe(true);

    grid.removeWall(1, 1);
    expect(grid.isWall(at(1, 1))).toBe(false);
  });

  it('are all cleared by reset', () => {
    const grid = new Grid({ columns: 5, rows: 5, walls: [at(1, 1), at(2, 2)] });

    grid.reset();

    expect(grid.wallsAsArray).toEqual([]);
  });
});

describe('neighbour discovery', () => {
  it('skips walls and already visited cells', () => {
    const grid = new Grid({
      columns: 5,
      rows: 5,
      start: at(0, 4),
      end: at(4, 0),
      walls: [at(2, 1)]
    });
    grid.visit(node(1, 2));

    const walkable = [...grid.getWalkableNeighbours(node(2, 2)).values()].map((n) => n.toArray());

    // up (2,1) is a wall, left (1,2) is visited
    expect(walkable.sort()).toEqual([
      [2, 3],
      [3, 2]
    ]);
  });

  it('does not walk off the edge of the grid', () => {
    const grid = new Grid({ columns: 3, rows: 3, start: at(2, 2), end: at(0, 2) });

    const walkable = [...grid.getWalkableNeighbours(node(0, 0)).values()].map((n) => n.toArray());

    expect(walkable.sort()).toEqual([
      [0, 1],
      [1, 0]
    ]);
  });
});

describe('nearestFreeCell', () => {
  it('returns an adjacent cell when one is free', () => {
    const grid = new Grid({ columns: 5, rows: 5, start: at(0, 0), end: at(4, 4) });

    const found = grid.nearestFreeCell(2, 2);

    expect(found).not.toBeNull();
    const [x, y] = found as [number, number];
    expect(Math.abs(x - 2) + Math.abs(y - 2)).toBe(1);
  });

  it('escapes a fully enclosed cell', () => {
    const grid = new Grid({
      columns: 5,
      rows: 5,
      start: at(0, 0),
      end: at(4, 4),
      walls: [at(1, 2), at(3, 2), at(2, 1), at(2, 3)]
    });

    const found = grid.nearestFreeCell(2, 2);

    expect(found).not.toBeNull();
    expect(grid.isCellFree(at(...(found as [number, number])))).toBe(true);
  });
});

describe('heuristics', () => {
  const from = node(0, 0);
  const to = node(3, 4);

  it('measures manhattan distance', () => {
    setHeuristicsFunction({ type: Heuristics.MANHATTAN });
    from.setParameters(to, node(0, 0));

    expect(from.hCost).toBe(7);
  });

  it('evaluates a custom mathjs formula', () => {
    setHeuristicsFunction({ type: Heuristics.CUSTOM, formula: 'sqrt(x^2 + y^2)' });
    from.setParameters(to, node(0, 0));

    expect(from.hCost).toBe(5);
  });

  it('combines g and h into the total cost used for ordering', () => {
    setHeuristicsFunction({ type: Heuristics.MANHATTAN });
    const parent = node(0, 0);
    parent.gCost = 4;
    const child = node(1, 0);
    child.setParameters(to, parent);

    expect(child.gCost).toBe(5);
    expect(child.totalCost).toBe(child.gCost + child.hCost);
    expect(child.parent).toBe(parent);
  });
});
