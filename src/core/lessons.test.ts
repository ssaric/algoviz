import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from './algorithms';
import { cellId } from './cell';
import { Grid, type SerializedGrid } from './Grid';
import { createHeuristic, type HeuristicSpec } from './heuristics';
import { findLesson, LESSONS, type Lesson, type LessonVariant } from './lessons';
import type { SearchOutcome, Step } from './protocol';
import { shortestPathLength } from './reference';
import { search } from './search';

const gridFor = (board: SerializedGrid) => new Grid({ ...board, walls: [...board.walls] });

function run(board: SerializedGrid, variant: LessonVariant) {
  const iterator = search(
    gridFor(board),
    ALGORITHMS[variant.algorithm],
    createHeuristic(variant.heuristic)
  );
  const steps: Step[] = [];
  let next = iterator.next();
  while (!next.done) {
    steps.push(next.value);
    next = iterator.next();
  }
  return { steps, outcome: next.value as SearchOutcome };
}

const lesson = (id: string): Lesson => {
  const found = LESSONS.find((l) => l.id === id);
  if (!found) throw new Error(`No lesson "${id}"`);
  return found;
};

const both = (l: Lesson) => [run(l.board, l.variants[0]), run(l.board, l.variants[1])] as const;

const runAll = (l: Lesson) => l.variants.map((variant) => run(l.board, variant));

const visitOrder = (steps: Step[]) =>
  steps.filter((s) => s.kind === 'visit').map((s) => cellId(s.cell));

describe('every lesson is well formed', () => {
  it.each(LESSONS.map((l) => [l.id, l] as const))('%s', (_id, l) => {
    expect(l.title).toBeTruthy();
    expect(l.hook).toBeTruthy();
    expect(l.watchFor).toBeTruthy();
    expect(l.body.length).toBeGreaterThanOrEqual(3);

    const labels = l.variants.map((v) => v.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('gives every lesson a variant count that matches its layout', () => {
    for (const l of LESSONS) {
      if (l.layout === 'frontier') expect(l.variants).toHaveLength(1);
      else if (l.layout === 'compare') expect(l.variants).toHaveLength(2);
      else expect(l.variants.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('has unique ids', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it('falls back to the first lesson for an unknown id', () => {
    expect(findLesson('nope')).toBe(LESSONS[0]);
    expect(findLesson(null)).toBe(LESSONS[0]);
    expect(findLesson(LESSONS[2].id)).toBe(LESSONS[2]);
  });

  it.each(LESSONS.map((l) => [l.id, l] as const))(
    '%s: every variant reaches the goal',
    (_id, l) => {
      for (const { outcome } of runAll(l)) expect(outcome.found).toBe(true);
    }
  );
});

/*
 * Below: the claims the write-ups make, asserted against the real search. If a
 * lesson's numbers stop being true, these fail rather than the page quietly
 * teaching something false.
 */

describe('exact-vs-optimistic', () => {
  const l = lesson('exact-vs-optimistic');
  const [manhattan, euclidean] = both(l);
  const optimal = shortestPathLength(gridFor(l.board));

  it('an exact heuristic expands only the corridor', () => {
    // Manhattan is the true remaining distance, so nothing scores below C* and
    // A* expands exactly as many cells as the path is long.
    expect(manhattan.outcome.stats.visited).toBe(optimal);
  });

  it('both return the same shortest path', () => {
    expect(manhattan.outcome.stats.pathLength).toBe(optimal);
    expect(euclidean.outcome.stats.pathLength).toBe(optimal);
  });

  it('the optimistic heuristic pays about ten times over', () => {
    const ratio = euclidean.outcome.stats.visited / manhattan.outcome.stats.visited;
    expect(ratio).toBeGreaterThan(8);
  });
});

describe('hidden-on-axis', () => {
  const l = lesson('hidden-on-axis');
  const [manhattan, euclidean] = both(l);

  it('the two heuristics are indistinguishable on an axis-aligned board', () => {
    expect(visitOrder(euclidean.steps)).toEqual(visitOrder(manhattan.steps));
    expect(euclidean.outcome).toEqual(manhattan.outcome);
  });

  it('agrees exactly when the offset has no vertical component', () => {
    const straight = createHeuristic({ kind: 'euclidean' });
    const stepwise = createHeuristic({ kind: 'manhattan' });
    const from = { x: 0, y: 0 };
    expect(straight(from, { x: 20, y: 0 })).toBe(stepwise(from, { x: 20, y: 0 }));
    expect(straight(from, { x: 10, y: 10 })).toBeLessThan(stepwise(from, { x: 10, y: 10 }));
  });
});

describe('overestimating-breaks-it', () => {
  const l = lesson('overestimating-breaks-it');
  const [manhattan, squared] = both(l);
  const optimal = shortestPathLength(gridFor(l.board)) as number;

  it('the admissible heuristic returns the shortest path', () => {
    expect(manhattan.outcome.stats.pathLength).toBe(optimal);
  });

  it('the overestimating one returns a path about twice as long', () => {
    expect(squared.outcome.stats.pathLength).toBeGreaterThan(optimal * 1.9);
  });

  it('and it is faster on an open board, which is what makes it a trap', () => {
    const open = lesson('exact-vs-optimistic').board;
    const asSquared = run(open, {
      label: 'squared',
      algorithm: 'astar',
      heuristic: { kind: 'euclidean-squared' } as HeuristicSpec
    });
    const asEuclidean = run(open, l.variants[0]);
    expect(asSquared.outcome.stats.visited).toBeLessThanOrEqual(asEuclidean.outcome.stats.visited);
    expect(asSquared.outcome.stats.pathLength).toBe(shortestPathLength(gridFor(open)));
  });
});

describe('greedy-takes-the-bait', () => {
  const l = lesson('greedy-takes-the-bait');
  const [astar, greedy] = both(l);
  const optimal = shortestPathLength(gridFor(l.board)) as number;

  it('A* finds the bypass', () => {
    expect(astar.outcome.stats.pathLength).toBe(optimal);
  });

  it('greedy walks the corridor and comes back with roughly double', () => {
    expect(greedy.outcome.stats.pathLength).toBeGreaterThan(optimal * 1.9);
  });
});

describe('dijkstra-ignores-the-goal', () => {
  const l = lesson('dijkstra-ignores-the-goal');
  const [astar, dijkstra] = both(l);

  it('expands far more while finding the same path', () => {
    expect(dijkstra.outcome.stats.pathLength).toBe(astar.outcome.stats.pathLength);
    expect(dijkstra.outcome.stats.visited).toBeGreaterThan(astar.outcome.stats.visited * 10);
  });

  it('records no heuristic at all', () => {
    expect(dijkstra.steps.every((s) => s.h === 0)).toBe(true);
  });
});

describe('same-search-three-names', () => {
  const l = lesson('same-search-three-names');
  const [dijkstra, bfs] = both(l);

  it('breadth-first and dijkstra are step-for-step identical under uniform cost', () => {
    expect(bfs.steps.length).toBe(dijkstra.steps.length);
    expect(visitOrder(bfs.steps)).toEqual(visitOrder(dijkstra.steps));
  });

  it('A* with h = 0 is the same search again', () => {
    const zero = run(l.board, {
      label: 'h = 0',
      algorithm: 'astar',
      heuristic: { kind: 'custom', formula: '0' }
    });
    expect(visitOrder(zero.steps)).toEqual(visitOrder(dijkstra.steps));
    expect(zero.outcome.stats).toEqual(dijkstra.outcome.stats);
  });
});

describe('meet-the-frontier', () => {
  const l = lesson('meet-the-frontier');
  const [dijkstra] = runAll(l);

  it('expands cells in non-decreasing order of cost from the start', () => {
    const visits = dijkstra.steps.filter((s) => s.kind === 'visit');
    for (let i = 1; i < visits.length; i++) {
      expect(visits[i].g).toBeGreaterThanOrEqual(visits[i - 1].g);
    }
  });

  it('never assigns a heuristic value: this run has none', () => {
    expect(dijkstra.steps.every((s) => s.h === 0)).toBe(true);
  });
});

describe('adding-a-heuristic', () => {
  const frontierLesson = lesson('meet-the-frontier');
  const heuristicLesson = lesson('adding-a-heuristic');
  const [dijkstra] = runAll(frontierLesson);
  const [astar] = runAll(heuristicLesson);

  it('expands no more of the same board than the plain frontier lesson did', () => {
    // Same board as "meet the frontier" -- the only variable that changed is
    // whether the score includes h at all.
    expect(heuristicLesson.board).toEqual(frontierLesson.board);
    expect(astar.outcome.stats.visited).toBeLessThanOrEqual(dijkstra.outcome.stats.visited);
  });

  it('still finds a shortest path', () => {
    const optimal = shortestPathLength(gridFor(heuristicLesson.board));
    expect(astar.outcome.stats.pathLength).toBe(optimal);
  });

  it('records a nonzero heuristic once it has been discovered', () => {
    const discovered = astar.steps.filter((s) => s.kind === 'discover');
    expect(discovered.some((s) => s.h > 0)).toBe(true);
  });
});

describe('speed-vs-correctness', () => {
  const l = lesson('speed-vs-correctness');
  const runs = runAll(l);
  const optimal = shortestPathLength(gridFor(l.board)) as number;
  const byLabel = Object.fromEntries(l.variants.map((v, i) => [v.label, runs[i]]));

  it('the two overestimating/heuristic-only strategies land on a longer path', () => {
    expect(byLabel['A* · Euclidean squared'].outcome.stats.pathLength).toBeGreaterThan(optimal);
    expect(byLabel['Greedy best-first'].outcome.stats.pathLength).toBeGreaterThan(optimal);
  });

  it('the three admissible strategies land on the shortest path', () => {
    for (const label of ['A* · Manhattan', 'A* · Euclidean', 'Dijkstra']) {
      expect(byLabel[label].outcome.stats.pathLength).toBe(optimal);
    }
  });

  it('the wrong answers are not the slow ones -- that is the entire point of the chart', () => {
    const dijkstraVisited = byLabel.Dijkstra.outcome.stats.visited;
    expect(byLabel['A* · Euclidean squared'].outcome.stats.visited).toBeLessThan(dijkstraVisited);
    expect(byLabel['Greedy best-first'].outcome.stats.visited).toBeLessThan(dijkstraVisited);
  });

  it('speed genuinely varies across the five, not just correctness', () => {
    const visited = runs.map((r) => r.outcome.stats.visited);
    expect(new Set(visited).size).toBeGreaterThan(1);
  });
});
