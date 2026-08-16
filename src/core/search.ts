import { cellId, cellsEqual, type Cell, type CellId } from './cell';
import type { Grid } from './Grid';
import type { HeuristicFn } from './heuristics';
import type { SearchOutcome, Step } from './protocol';

type SearchNode = {
  cell: Cell;
  g: number;
  h: number;
  f: number;
  parent: SearchNode | null;
};

const round = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

/**
 * Pull the most promising node off the frontier: lowest f, breaking ties on the
 * lower heuristic so the search leans towards the goal rather than sideways.
 *
 * A linear scan rather than a heap. The frontier is bounded by the cell count
 * and this stays obvious to read, which matters more here than the constant.
 */
function takeCheapest(frontier: SearchNode[]): SearchNode {
  let bestIndex = 0;
  for (let i = 1; i < frontier.length; i++) {
    const node = frontier[i];
    const best = frontier[bestIndex];
    if (node.f < best.f || (node.f === best.f && node.h < best.h)) bestIndex = i;
  }
  return frontier.splice(bestIndex, 1)[0];
}

function tracePath(goal: SearchNode): SearchNode[] {
  const path: SearchNode[] = [];
  for (let node: SearchNode | null = goal; node !== null; node = node.parent) path.push(node);
  return path.reverse();
}

/**
 * A* over the grid, yielding a described Step for every decision it makes.
 *
 * A generator rather than a callback or a postMessage loop: the algorithm has
 * no idea it is running in a worker, which is what makes it testable.
 */
export function* search(grid: Grid, heuristic: HeuristicFn): Generator<Step, SearchOutcome> {
  const { start, end } = grid;

  const startNode: SearchNode = {
    cell: start,
    g: 0,
    h: heuristic(start, end),
    f: 0,
    parent: null
  };
  startNode.f = startNode.h;

  const frontier: SearchNode[] = [startNode];
  const onFrontier = new Map<CellId, SearchNode>([[cellId(start), startNode]]);
  const settled = new Set<CellId>();

  let discovered = 1;
  let visited = 0;

  while (frontier.length > 0) {
    const current = takeCheapest(frontier);
    const currentId = cellId(current.cell);
    onFrontier.delete(currentId);
    settled.add(currentId);
    visited++;

    yield {
      kind: 'visit',
      cell: current.cell,
      g: current.g,
      h: current.h,
      f: current.f,
      parent: current.parent?.cell ?? null,
      note: `Cheapest cell on the frontier at f = g + h = ${round(current.g)} + ${round(current.h)} = ${round(current.f)}. Expanding it.`
    };

    if (cellsEqual(current.cell, end)) {
      const path = tracePath(current);
      for (const [index, node] of path.entries()) {
        yield {
          kind: 'path',
          cell: node.cell,
          g: node.g,
          h: node.h,
          f: node.f,
          parent: node.parent?.cell ?? null,
          note: `Step ${index + 1} of ${path.length} on the cheapest path found.`
        };
      }
      return { found: true, stats: { visited, discovered, pathLength: path.length } };
    }

    for (const next of grid.neighbours(current.cell)) {
      const nextId = cellId(next);
      if (settled.has(nextId)) continue;

      const g = current.g + 1;
      const h = heuristic(next, end);
      const existing = onFrontier.get(nextId);

      if (existing && g >= existing.g) {
        yield {
          kind: 'skip',
          cell: next,
          g: existing.g,
          h: existing.h,
          f: existing.f,
          parent: existing.parent?.cell ?? null,
          note: `Already reachable in ${round(existing.g)}; going through here would cost ${round(g)}. Keeping the cheaper route.`
        };
        continue;
      }

      if (existing) {
        const previousG = existing.g;
        existing.g = g;
        existing.f = g + h;
        existing.parent = current;
        yield {
          kind: 'reopen',
          cell: next,
          g,
          h,
          f: existing.f,
          parent: current.cell,
          note: `Better route found: cost drops from ${round(previousG)} to ${round(g)}. Re-parenting it.`
        };
        continue;
      }

      const node: SearchNode = { cell: next, g, h, f: g + h, parent: current };
      frontier.push(node);
      onFrontier.set(nextId, node);
      discovered++;
      yield {
        kind: 'discover',
        cell: next,
        g,
        h,
        f: node.f,
        parent: current.cell,
        note: `New cell. ${round(g)} from the start, an estimated ${round(h)} to the goal, so f = ${round(node.f)}.`
      };
    }
  }

  return { found: false, stats: { visited, discovered, pathLength: 0 } };
}
