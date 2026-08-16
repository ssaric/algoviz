import { cellId, type Cell, type CellId } from './cell';
import type { Step } from './protocol';

/** One cell currently on the frontier, as far as the playhead has reached. */
export type FrontierEntry = {
  readonly cell: Cell;
  readonly g: number;
  readonly h: number;
  readonly priority: number;
  /** Step index at which this cell entered the frontier, or was last re-parented. */
  readonly since: number;
};

/**
 * Reconstructs the priority queue's contents at a point in the timeline by
 * replaying the steps that produced it.
 *
 * This mirrors exactly what the search's own frontier bookkeeping does:
 * `discover` adds a cell, `reopen` updates one already there with a cheaper
 * route, `visit` removes it once expanded. `skip` and `path` never touch
 * membership. Replaying from scratch rather than tracking incrementally means
 * seeking backwards needs no special case -- the frontier at any cursor is
 * just "whatever these rules produce up to there."
 */
export function frontierAt(steps: readonly Step[], cursor: number): FrontierEntry[] {
  const frontier = new Map<CellId, FrontierEntry>();

  // The search's own frontier starts with the start cell already on it, one
  // moment before anything is yielded -- so the very first step is always
  // that cell's own visit, and its numbers are exactly the seed this needs.
  const first = steps[0];
  if (first && first.kind === 'visit') {
    frontier.set(cellId(first.cell), {
      cell: first.cell,
      g: first.g,
      h: first.h,
      priority: first.priority,
      since: -1
    });
  }

  const limit = Math.min(cursor, steps.length);

  for (let i = 0; i < limit; i++) {
    const step = steps[i];
    const id = cellId(step.cell);

    switch (step.kind) {
      case 'discover':
        frontier.set(id, {
          cell: step.cell,
          g: step.g,
          h: step.h,
          priority: step.priority,
          since: i
        });
        break;
      case 'reopen':
        frontier.set(id, {
          cell: step.cell,
          g: step.g,
          h: step.h,
          priority: step.priority,
          since: frontier.get(id)?.since ?? i
        });
        break;
      case 'visit':
        frontier.delete(id);
        break;
      case 'skip':
      case 'path':
        break;
    }
  }

  // Same ordering the search itself uses to pick: lowest priority first,
  // ties towards the lower heuristic, then towards whichever waited longest.
  return [...frontier.values()].sort(
    (a, b) => a.priority - b.priority || a.h - b.h || a.since - b.since
  );
}
