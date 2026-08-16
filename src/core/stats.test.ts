import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from './algorithms';
import { cell } from './cell';
import { Grid } from './Grid';
import { createHeuristic } from './heuristics';
import { runToCompletion } from './search';
import { statsAt } from './stats';

describe('statsAt', () => {
  const grid = new Grid({ columns: 12, rows: 9, start: cell(0, 4), end: cell(11, 4) });
  const { steps, outcome } = runToCompletion(
    grid,
    ALGORITHMS.astar,
    createHeuristic({ kind: 'manhattan' })
  );

  it('counts only the start cell as discovered before anything else has been applied', () => {
    // The search's own frontier begins with the start cell already on it --
    // the same initial condition frontierAt seeds separately.
    expect(statsAt(steps, 0)).toEqual({ visited: 0, discovered: 1, pathLength: 0 });
  });

  it('is all zero for an empty step list', () => {
    expect(statsAt([], 0)).toEqual({ visited: 0, discovered: 0, pathLength: 0 });
  });

  it("matches the algorithm's own final tally at the end of the run", () => {
    expect(statsAt(steps, steps.length)).toEqual(outcome.stats);
  });

  it('only counts events up to the cursor, not the whole run', () => {
    const firstVisit = steps.findIndex((s) => s.kind === 'visit');
    const partial = statsAt(steps, firstVisit + 1);

    expect(partial.visited).toBe(1);
    expect(partial.visited).toBeLessThan(outcome.stats.visited);
  });

  it('path length only grows once the backtrack begins, not during the search', () => {
    const firstPathIndex = steps.findIndex((s) => s.kind === 'path');
    expect(statsAt(steps, firstPathIndex).pathLength).toBe(0);
    expect(statsAt(steps, firstPathIndex + 1).pathLength).toBe(1);
  });

  it('grows monotonically as the cursor advances', () => {
    let previous = statsAt(steps, 0);
    for (let cursor = 1; cursor <= steps.length; cursor++) {
      const current = statsAt(steps, cursor);
      expect(current.visited).toBeGreaterThanOrEqual(previous.visited);
      expect(current.discovered).toBeGreaterThanOrEqual(previous.discovered);
      expect(current.pathLength).toBeGreaterThanOrEqual(previous.pathLength);
      previous = current;
    }
  });
});
