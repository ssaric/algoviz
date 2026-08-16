import type { Algorithm } from './algorithms';
import { cellId, cellsEqual, type Cell, type CellId } from './cell';
import type { Grid } from './Grid';
import type { HeuristicFn } from './heuristics';
import type { SearchOutcome, Step } from './protocol';

type SearchNode = {
  cell: Cell;
  g: number;
  h: number;
  order: number;
  priority: number;
  parent: SearchNode | null;
};

const round = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

/**
 * Pull the most promising node off the frontier.
 *
 * Ties break on the heuristic first, so a goal-aware search leans towards the
 * goal instead of sideways, and on discovery order last, which is what keeps
 * breadth-first strictly first-in-first-out.
 *
 * A linear scan rather than a heap. The frontier is bounded by the cell count
 * and this stays obvious to read, which matters more here than the constant.
 */
function takeBest(frontier: SearchNode[]): SearchNode {
  let bestIndex = 0;
  for (let i = 1; i < frontier.length; i++) {
    const node = frontier[i];
    const best = frontier[bestIndex];
    const better =
      node.priority < best.priority ||
      (node.priority === best.priority &&
        (node.h < best.h || (node.h === best.h && node.order < best.order)));
    if (better) bestIndex = i;
  }
  return frontier.splice(bestIndex, 1)[0];
}

function tracePath(goal: SearchNode): SearchNode[] {
  const path: SearchNode[] = [];
  for (let node: SearchNode | null = goal; node !== null; node = node.parent) path.push(node);
  return path.reverse();
}

/**
 * Best-first search over the grid, yielding a described Step for every decision
 * it makes. Which search it actually is comes entirely from `algorithm`.
 *
 * A generator rather than a callback or a postMessage loop: the algorithm has
 * no idea it is running in a worker, which is what makes it testable.
 */
export function* search(
  grid: Grid,
  algorithm: Algorithm,
  heuristic: HeuristicFn
): Generator<Step, SearchOutcome> {
  const { start, end } = grid;
  const estimate = (c: Cell): number => (algorithm.usesHeuristic ? heuristic(c, end) : 0);

  let order = 0;
  const makeNode = (c: Cell, g: number, parent: SearchNode | null): SearchNode => {
    const h = estimate(c);
    const node = { cell: c, g, h, order: order++, priority: 0, parent };
    node.priority = algorithm.priority(node);
    return node;
  };

  const startNode = makeNode(start, 0, null);
  const frontier: SearchNode[] = [startNode];
  const onFrontier = new Map<CellId, SearchNode>([[cellId(start), startNode]]);
  const settled = new Set<CellId>();

  let discovered = 1;
  let visited = 0;

  while (frontier.length > 0) {
    const current = takeBest(frontier);
    const currentId = cellId(current.cell);
    onFrontier.delete(currentId);
    settled.add(currentId);
    visited++;

    yield {
      kind: 'visit',
      cell: current.cell,
      g: current.g,
      h: current.h,
      priority: current.priority,
      parent: current.parent?.cell ?? null,
      note: `Picked next because ${algorithm.affinity} — ${algorithm.score(current)}.`
    };

    if (cellsEqual(current.cell, end)) {
      const path = tracePath(current);
      for (const [index, node] of path.entries()) {
        yield {
          kind: 'path',
          cell: node.cell,
          g: node.g,
          h: node.h,
          priority: node.priority,
          parent: node.parent?.cell ?? null,
          note: `Step ${index + 1} of ${path.length} on the path ${algorithm.name} settled on.`
        };
      }
      return { found: true, stats: { visited, discovered, pathLength: path.length } };
    }

    for (const next of grid.neighbours(current.cell)) {
      const nextId = cellId(next);
      if (settled.has(nextId)) continue;

      const g = current.g + 1;
      const existing = onFrontier.get(nextId);

      if (existing && g >= existing.g) {
        yield {
          kind: 'skip',
          cell: next,
          g: existing.g,
          h: existing.h,
          priority: existing.priority,
          parent: existing.parent?.cell ?? null,
          note: `Already reachable in ${round(existing.g)}; going through here would cost ${round(g)}. Keeping the cheaper route.`
        };
        continue;
      }

      if (existing) {
        const previousG = existing.g;
        existing.g = g;
        existing.parent = current;
        existing.priority = algorithm.priority(existing);
        yield {
          kind: 'reopen',
          cell: next,
          g,
          h: existing.h,
          priority: existing.priority,
          parent: current.cell,
          note: `Better route found: cost drops from ${round(previousG)} to ${round(g)}. Re-parenting it.`
        };
        continue;
      }

      const node = makeNode(next, g, current);
      frontier.push(node);
      onFrontier.set(nextId, node);
      discovered++;
      yield {
        kind: 'discover',
        cell: next,
        g: node.g,
        h: node.h,
        priority: node.priority,
        parent: current.cell,
        note: `New cell, ${round(g)} from the start — ${algorithm.score(node)}.`
      };
    }
  }

  return { found: false, stats: { visited, discovered, pathLength: 0 } };
}
