import type { SearchStats, Step } from './protocol';

/**
 * Tallies expanded/discovered/path counts up to a point in the timeline,
 * rather than only at the search's end.
 *
 * `SearchOutcome.stats` is the algorithm's own final tally and only exists
 * once a search completes; this is the same shape of number but computed for
 * wherever the scrubber happens to be, so the figures under a board update as
 * it plays instead of sitting frozen at the final answer until the run ends.
 * At cursor === steps.length the two agree exactly, since a Step is yielded
 * for precisely the events the algorithm itself counts.
 */
export function statsAt(steps: readonly Step[], cursor: number): SearchStats {
  let visited = 0;
  // The start cell is "discovered" the instant the search begins, before
  // anything is yielded -- the same reason frontierAt seeds it separately.
  // The algorithm's own counter starts at 1 for exactly this reason.
  let discovered = steps.length > 0 ? 1 : 0;
  let pathLength = 0;
  const limit = Math.min(cursor, steps.length);

  for (let i = 0; i < limit; i++) {
    switch (steps[i].kind) {
      case 'visit':
        visited++;
        break;
      case 'discover':
        discovered++;
        break;
      case 'path':
        pathLength++;
        break;
      case 'reopen':
      case 'skip':
        break;
    }
  }

  return { visited, discovered, pathLength };
}
