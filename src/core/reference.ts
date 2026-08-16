import { cellId, cellsEqual, type Cell, type CellId } from './cell';
import type { Grid } from './Grid';

/**
 * Length of a genuinely shortest path, found by plain breadth-first search.
 *
 * Used as the yardstick a lesson holds its results against: it is the only way
 * to say "greedy came back with a path four cells longer than it needed to be"
 * rather than merely asserting that it might. Every move costs one, so BFS is
 * exact here and needs no heuristic to argue with.
 *
 * Returns the number of cells on the path, or null when the goal is unreachable.
 */
export function shortestPathLength(grid: Grid): number | null {
  const { start, end } = grid;
  if (cellsEqual(start, end)) return 1;

  const seen = new Set<CellId>([cellId(start)]);
  let frontier: Cell[] = [start];
  let distance = 1;

  while (frontier.length > 0) {
    const next: Cell[] = [];
    distance++;
    for (const current of frontier) {
      for (const neighbour of grid.neighbours(current)) {
        if (cellsEqual(neighbour, end)) return distance;
        const id = cellId(neighbour);
        if (seen.has(id)) continue;
        seen.add(id);
        next.push(neighbour);
      }
    }
    frontier = next;
  }
  return null;
}
