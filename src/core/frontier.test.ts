import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from './algorithms';
import { cell, cellId } from './cell';
import { frontierAt } from './frontier';
import { Grid } from './Grid';
import { createHeuristic } from './heuristics';
import { runToCompletion } from './search';

describe('frontierAt', () => {
  it('holds only the start cell before the first step is applied', () => {
    const grid = new Grid({ columns: 5, rows: 5, start: cell(0, 0), end: cell(4, 4) });
    const { steps } = runToCompletion(
      grid,
      ALGORITHMS.astar,
      createHeuristic({ kind: 'manhattan' })
    );

    // The search's own frontier begins with the start cell on it, before
    // anything has been yielded -- that is the state cursor 0 describes.
    const frontier = frontierAt(steps, 0);
    expect(frontier).toHaveLength(1);
    expect(frontier[0].cell).toEqual(cell(0, 0));
  });

  it("matches the search's own choice: its cheapest member is always what gets visited next", () => {
    const grid = new Grid({
      columns: 12,
      rows: 9,
      start: cell(0, 4),
      end: cell(11, 4),
      walls: [cell(5, 2), cell(5, 3), cell(5, 4), cell(5, 5), cell(5, 6)]
    });
    const { steps } = runToCompletion(
      grid,
      ALGORITHMS.astar,
      createHeuristic({ kind: 'manhattan' })
    );

    const visits = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.kind === 'visit');

    for (const { step, index } of visits) {
      const frontierBefore = frontierAt(steps, index);
      // The visited cell was on the frontier and ranked first, by
      // construction: it is exactly what was popped to produce this step.
      expect(frontierBefore[0]?.cell).toEqual(step.cell);
    }
  });

  it('removes a cell once it is visited', () => {
    const grid = new Grid({ columns: 5, rows: 5, start: cell(0, 0), end: cell(4, 4) });
    const { steps } = runToCompletion(
      grid,
      ALGORITHMS.dijkstra,
      createHeuristic({ kind: 'manhattan' })
    );

    // The second visit is the first one with a real predecessor in the
    // frontier reconstruction (the first visit is the seeded start cell).
    const firstVisitIndex = steps.findIndex((s) => s.kind === 'visit');
    const secondVisitIndex = steps.findIndex((s, i) => s.kind === 'visit' && i > firstVisitIndex);
    const visitedCell = steps[secondVisitIndex].cell;

    const before = frontierAt(steps, secondVisitIndex);
    const after = frontierAt(steps, secondVisitIndex + 1);

    expect(before.map((e) => cellId(e.cell))).toContain(cellId(visitedCell));
    expect(after.map((e) => cellId(e.cell))).not.toContain(cellId(visitedCell));
  });

  it('replaces an entry in place when a cheaper route reopens it', () => {
    // Found by sweeping random layouts for one where an overestimating
    // heuristic expands out of cost order enough to revisit a frontier cell
    // more cheaply -- on a uniform-cost grid explored in cost order (Dijkstra,
    // BFS, or A* with an admissible heuristic) this essentially never happens.
    const wallCoords: [number, number][] = [
      [0, 8],
      [0, 9],
      [1, 0],
      [1, 6],
      [1, 7],
      [2, 4],
      [2, 8],
      [3, 1],
      [3, 2],
      [3, 5],
      [3, 7],
      [4, 4],
      [4, 8],
      [5, 1],
      [5, 3],
      [5, 4],
      [5, 6],
      [6, 4],
      [6, 5],
      [6, 6],
      [6, 9],
      [7, 1],
      [7, 3],
      [7, 4],
      [7, 5],
      [8, 4],
      [8, 8],
      [9, 5],
      [9, 6],
      [10, 3],
      [10, 7],
      [10, 8],
      [11, 6],
      [11, 8],
      [12, 3],
      [12, 4],
      [12, 8],
      [13, 6],
      [13, 7],
      [13, 8]
    ];
    const grid = new Grid({
      columns: 14,
      rows: 10,
      start: cell(0, 0),
      end: cell(13, 9),
      walls: wallCoords.map(([x, y]) => cell(x, y))
    });
    const { steps } = runToCompletion(
      grid,
      ALGORITHMS.astar,
      createHeuristic({ kind: 'euclidean-squared' })
    );

    const reopenIndex = steps.findIndex((s) => s.kind === 'reopen');
    expect(reopenIndex).toBeGreaterThan(-1);
    const reopened = steps[reopenIndex];

    const frontier = frontierAt(steps, reopenIndex + 1);
    const entry = frontier.find((e) => cellId(e.cell) === cellId(reopened.cell));

    // Reopening updates the existing entry's cost rather than duplicating it.
    expect(entry?.g).toBe(reopened.g);
    expect(frontier.filter((e) => cellId(e.cell) === cellId(reopened.cell))).toHaveLength(1);
  });

  it('is sorted best-first, the same order the search itself expands in', () => {
    const grid = new Grid({ columns: 10, rows: 10, start: cell(0, 0), end: cell(9, 9) });
    const { steps } = runToCompletion(
      grid,
      ALGORITHMS.astar,
      createHeuristic({ kind: 'euclidean' })
    );

    const frontier = frontierAt(steps, Math.floor(steps.length / 2));
    for (let i = 1; i < frontier.length; i++) {
      expect(frontier[i].priority).toBeGreaterThanOrEqual(frontier[i - 1].priority);
    }
  });

  it('reconstructs the same frontier whether the step list is trimmed to the cursor or handed in full', () => {
    const grid = new Grid({ columns: 9, rows: 9, start: cell(0, 0), end: cell(8, 8) });
    const { steps } = runToCompletion(
      grid,
      ALGORITHMS.greedy,
      createHeuristic({ kind: 'manhattan' })
    );
    const midpoint = Math.floor(steps.length / 2);

    expect(frontierAt(steps, midpoint)).toEqual(frontierAt(steps.slice(0, midpoint), midpoint));
  });
});
