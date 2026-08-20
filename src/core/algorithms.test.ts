import { describe, expect, it } from 'vitest';
import { ALGORITHM_IDS, ALGORITHMS, type AlgorithmId } from './algorithms';
import { Grid } from './Grid';
import { cell } from './cell';
import { createHeuristic } from './heuristics';
import type { Step } from './protocol';
import { search } from './search';

function run(algorithm: AlgorithmId, grid: Grid) {
  const steps: Step[] = [];
  const iterator = search(grid, ALGORITHMS[algorithm], createHeuristic({ kind: 'manhattan' }));
  let next = iterator.next();
  while (!next.done) {
    steps.push(next.value);
    next = iterator.next();
  }
  return { steps, outcome: next.value };
}

/** Open board with a wall that makes the greedy choice the wrong one: heading
 *  straight at the goal runs into a dead end that has to be backed out of. */
const trap = () =>
  new Grid({
    columns: 11,
    rows: 9,
    start: cell(0, 4),
    end: cell(10, 4),
    walls: [
      cell(5, 0),
      cell(5, 1),
      cell(5, 2),
      cell(5, 3),
      cell(5, 4),
      cell(5, 5),
      cell(5, 6),
      cell(5, 7)
    ]
  });

describe('every algorithm', () => {
  it.each(ALGORITHM_IDS)('%s finds a route through the trap', (id) => {
    const { outcome } = run(id, trap());

    expect(outcome.found).toBe(true);
    expect(outcome.stats.pathLength).toBeGreaterThan(0);
  });

  it.each(ALGORITHM_IDS)('%s explains itself on every step', (id) => {
    const { steps } = run(id, trap());

    expect(steps.length).toBeGreaterThan(0);
    for (const step of steps) expect(step.note.key).toBeTruthy();
  });

  it.each(ALGORITHM_IDS)('%s expands each cell at most once', (id) => {
    const visits = run(id, trap())
      .steps.filter((s) => s.kind === 'visit')
      .map((s) => `${s.cell.x},${s.cell.y}`);

    expect(new Set(visits).size).toBe(visits.length);
  });
});

describe('optimality', () => {
  // A* and Dijkstra are both guaranteed to return a shortest path; BFS is too
  // when every move costs the same, which it does on this grid.
  it.each(['astar', 'dijkstra', 'bfs'] as AlgorithmId[])('%s returns a shortest path', (id) => {
    const optimal = run('dijkstra', trap()).outcome.stats.pathLength;

    expect(run(id, trap()).outcome.stats.pathLength).toBe(optimal);
  });

  it('greedy best-first is allowed to return a longer path', () => {
    const optimal = run('dijkstra', trap()).outcome.stats.pathLength;

    expect(run('greedy', trap()).outcome.stats.pathLength).toBeGreaterThanOrEqual(optimal);
  });
});

describe('affinities show up in how much gets explored', () => {
  it('greedy reaches the goal after expanding far fewer cells than dijkstra', () => {
    const greedy = run('greedy', trap()).outcome.stats.visited;
    const dijkstra = run('dijkstra', trap()).outcome.stats.visited;

    expect(greedy).toBeLessThan(dijkstra);
  });

  it('a goal-aware search expands no more than an unguided one', () => {
    const astar = run('astar', trap()).outcome.stats.visited;
    const dijkstra = run('dijkstra', trap()).outcome.stats.visited;

    expect(astar).toBeLessThanOrEqual(dijkstra);
  });

  it('dijkstra and breadth-first ignore the heuristic entirely', () => {
    const grid = trap();
    const withManhattan = search(grid, ALGORITHMS.dijkstra, createHeuristic({ kind: 'manhattan' }));
    const withEuclidean = search(grid, ALGORITHMS.dijkstra, createHeuristic({ kind: 'euclidean' }));

    expect([...withManhattan].map((s) => s.cell)).toEqual([...withEuclidean].map((s) => s.cell));
  });
});

describe('priority reflects the algorithm', () => {
  const at = (steps: Step[], kind: Step['kind']) => steps.find((s) => s.kind === kind)!;

  it('scores A* by g + h', () => {
    const step = at(run('astar', trap()).steps, 'discover');
    expect(step.priority).toBeCloseTo(step.g + step.h);
  });

  it('scores dijkstra by g alone, with no heuristic recorded', () => {
    const step = at(run('dijkstra', trap()).steps, 'discover');
    expect(step.h).toBe(0);
    expect(step.priority).toBe(step.g);
  });

  it('scores greedy by h alone', () => {
    const step = at(run('greedy', trap()).steps, 'discover');
    expect(step.priority).toBe(step.h);
  });

  it('scores breadth-first by discovery order, not distance', () => {
    const discovers = run('bfs', trap()).steps.filter((s) => s.kind === 'discover');
    const priorities = discovers.map((s) => s.priority);

    expect(discovers.every((s) => s.h === 0)).toBe(true);
    // Discovery order only ever increases.
    expect([...priorities].sort((a, b) => a - b)).toEqual(priorities);
  });
});

describe('breadth-first explores in rings', () => {
  it('never expands a cell before a closer one', () => {
    const grid = new Grid({ columns: 9, rows: 9, start: cell(4, 4), end: cell(0, 0) });

    const distances = run('bfs', grid)
      .steps.filter((s) => s.kind === 'visit')
      .map((s) => s.g);

    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });
});
