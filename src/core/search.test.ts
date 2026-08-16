import { describe, expect, it } from 'vitest';
import { Grid } from './Grid';
import { cell, cellsEqual, type Cell } from './cell';
import { createHeuristic, type HeuristicSpec } from './heuristics';
import type { SearchOutcome, Step } from './protocol';
import { search } from './search';

function run(grid: Grid, spec: HeuristicSpec = { kind: 'manhattan' }) {
  const steps: Step[] = [];
  const iterator = search(grid, createHeuristic(spec));
  let next = iterator.next();
  while (!next.done) {
    steps.push(next.value);
    next = iterator.next();
  }
  return { steps, outcome: next.value as SearchOutcome };
}

const pathOf = (steps: Step[]): Cell[] => steps.filter((s) => s.kind === 'path').map((s) => s.cell);

describe('finding a path', () => {
  it('walks an open board from start to end', () => {
    const grid = new Grid({ columns: 6, rows: 3, start: cell(0, 1), end: cell(5, 1) });

    const { steps, outcome } = run(grid);
    const path = pathOf(steps);

    expect(outcome.found).toBe(true);
    expect(path[0]).toEqual(cell(0, 1));
    expect(path.at(-1)).toEqual(cell(5, 1));
    // Manhattan distance is 5, so the path is 6 cells including both ends.
    expect(path).toHaveLength(6);
  });

  it('returns the path start-first so it can be drawn in travel order', () => {
    const grid = new Grid({ columns: 4, rows: 1, start: cell(0, 0), end: cell(3, 0) });

    const path = pathOf(run(grid).steps);

    expect(path).toEqual([cell(0, 0), cell(1, 0), cell(2, 0), cell(3, 0)]);
  });

  it('routes around a wall', () => {
    const grid = new Grid({
      columns: 5,
      rows: 3,
      start: cell(0, 1),
      end: cell(4, 1),
      walls: [cell(2, 0), cell(2, 1)]
    });

    const { steps, outcome } = run(grid);

    expect(outcome.found).toBe(true);
    expect(pathOf(steps)).toContainEqual(cell(2, 2));
    expect(pathOf(steps)).not.toContainEqual(cell(2, 1));
  });

  it('reports failure when the goal is walled off', () => {
    const grid = new Grid({
      columns: 3,
      rows: 3,
      start: cell(0, 1),
      end: cell(2, 1),
      walls: [cell(1, 0), cell(1, 1), cell(1, 2)]
    });

    const { steps, outcome } = run(grid);

    expect(outcome.found).toBe(false);
    expect(outcome.stats.pathLength).toBe(0);
    expect(pathOf(steps)).toEqual([]);
  });

  it('handles the start already being the goal', () => {
    const grid = new Grid({ columns: 3, rows: 3, start: cell(1, 1), end: cell(1, 1) });

    const { steps, outcome } = run(grid);

    expect(outcome.found).toBe(true);
    expect(pathOf(steps)).toEqual([cell(1, 1)]);
  });
});

describe('step stream', () => {
  const grid = new Grid({ columns: 5, rows: 4, start: cell(0, 0), end: cell(4, 3) });
  const { steps } = run(grid);

  it('describes every step in plain language', () => {
    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) {
      expect(step.note.length).toBeGreaterThan(0);
      expect(Number.isFinite(step.f)).toBe(true);
      expect(step.f).toBeCloseTo(step.g + step.h);
    }
  });

  it('discovers each cell at most once, so drawing stays reversible', () => {
    const discovered = steps
      .filter((s) => s.kind === 'discover')
      .map((s) => `${s.cell.x},${s.cell.y}`);

    expect(new Set(discovered).size).toBe(discovered.length);
  });

  it('never visits a cell it has not discovered first', () => {
    const seen = new Set<string>([`${grid.start.x},${grid.start.y}`]);
    for (const step of steps) {
      const id = `${step.cell.x},${step.cell.y}`;
      if (step.kind === 'discover') seen.add(id);
      if (step.kind === 'visit') expect(seen.has(id)).toBe(true);
    }
  });

  it('only ever expands a cell once', () => {
    const visits = steps.filter((s) => s.kind === 'visit').map((s) => `${s.cell.x},${s.cell.y}`);

    expect(new Set(visits).size).toBe(visits.length);
  });

  it('reports stats that match the stream', () => {
    const { steps: s, outcome } = run(grid);

    expect(outcome.stats.visited).toBe(s.filter((x) => x.kind === 'visit').length);
    expect(outcome.stats.pathLength).toBe(s.filter((x) => x.kind === 'path').length);
  });
});

describe('heuristics change the search, not the answer', () => {
  const build = () =>
    new Grid({
      columns: 8,
      rows: 6,
      start: cell(0, 0),
      end: cell(7, 5),
      walls: [cell(3, 2), cell(3, 3)]
    });

  it('finds an equally short path with manhattan and euclidean', () => {
    const manhattan = run(build(), { kind: 'manhattan' });
    const euclidean = run(build(), { kind: 'euclidean' });

    expect(manhattan.outcome.found).toBe(true);
    expect(euclidean.outcome.found).toBe(true);
    expect(manhattan.outcome.stats.pathLength).toBe(euclidean.outcome.stats.pathLength);
  });

  it('accepts a custom mathjs formula', () => {
    const { outcome } = run(build(), { kind: 'custom', formula: 'sqrt(x^2 + y^2)' });

    expect(outcome.found).toBe(true);
  });

  it('surfaces a formula that does not produce a number', () => {
    expect(() => run(build(), { kind: 'custom', formula: '"nope"' })).toThrow(/finite number/);
  });

  it('produces the shortest possible path on an open board', () => {
    const grid = new Grid({ columns: 10, rows: 10, start: cell(0, 0), end: cell(9, 9) });

    const { steps, outcome } = run(grid, { kind: 'manhattan' });
    const path = pathOf(steps);

    expect(outcome.found).toBe(true);
    expect(path).toHaveLength(19); // 9 across + 9 down + the start cell
    expect(cellsEqual(path[0], grid.start)).toBe(true);
  });
});
