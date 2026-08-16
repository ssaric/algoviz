import type { AlgorithmId } from './algorithms';
import type { Cell } from './cell';
import type { SerializedGrid } from './Grid';
import type { HeuristicSpec } from './heuristics';

/**
 * What the search did on one move, as plain serializable data.
 *
 * Steps are data rather than closures so they can cross the worker boundary,
 * be replayed in either direction, be unit tested without a DOM, and -- the
 * reason `note` exists -- be shown to the user as the algorithm's reasoning.
 */
export type StepKind =
  /** Taken off the frontier and expanded. */
  | 'visit'
  /** Seen for the first time and put on the frontier. */
  | 'discover'
  /** Already on the frontier, but this route reaches it more cheaply. */
  | 'reopen'
  /** Already reachable at least as cheaply by a route we already have. */
  | 'skip'
  /** Part of the final path, walked back from the goal. */
  | 'path';

export type Step = {
  readonly kind: StepKind;
  readonly cell: Cell;
  /** Cost of the cheapest known route from the start to this cell. */
  readonly g: number;
  /** Heuristic estimate from this cell to the goal; 0 if unused. */
  readonly h: number;
  /** Score the algorithm ordered this cell by. Its meaning is the algorithm's
   *  affinity: g + h for A*, g for Dijkstra, h for greedy, order for BFS. */
  readonly priority: number;
  readonly parent: Cell | null;
  readonly note: string;
};

export type SearchStats = {
  readonly visited: number;
  readonly discovered: number;
  readonly pathLength: number;
};

export type SearchOutcome = {
  readonly found: boolean;
  readonly stats: SearchStats;
};

/** Main thread -> worker. */
export type WorkerRequest = {
  readonly kind: 'solve';
  readonly runId: number;
  readonly grid: SerializedGrid;
  readonly algorithm: AlgorithmId;
  readonly heuristic: HeuristicSpec;
};

/** Worker -> main thread. Every message carries the run it belongs to so the
 *  main thread can drop results from a run it has already abandoned. */
export type WorkerResponse =
  | { readonly kind: 'started'; readonly runId: number }
  | { readonly kind: 'steps'; readonly runId: number; readonly steps: readonly Step[] }
  | { readonly kind: 'finished'; readonly runId: number; readonly outcome: SearchOutcome }
  | { readonly kind: 'failed'; readonly runId: number; readonly message: string };

/** Steps are posted in batches; one message per step floods the event loop. */
export const STEP_BATCH_SIZE = 250;
