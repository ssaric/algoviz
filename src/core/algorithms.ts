export type AlgorithmId = 'astar' | 'dijkstra' | 'greedy' | 'bfs';

/** What the frontier knows about a candidate cell when ordering it. */
export type FrontierNode = {
  /** Cost of the cheapest known route from the start. */
  readonly g: number;
  /** Heuristic estimate to the goal; always 0 when an algorithm ignores it. */
  readonly h: number;
  /** Position in discovery order, which is all BFS cares about. */
  readonly order: number;
};

/**
 * All four searches here are the same best-first loop. The only thing that
 * separates them is what they are drawn to -- their affinity -- expressed as
 * the priority they assign a cell on the frontier. Lowest priority wins.
 */
export type Algorithm = {
  readonly id: AlgorithmId;
  /** Message keys, not English -- core/ has no i18n available to it (it runs
   *  in the worker), so the UI layer resolves these against the active
   *  locale. See src/i18n/locales/en.json under "algorithm". */
  readonly nameKey: string;
  readonly blurbKey: string;
  /** What makes a cell attractive to this algorithm, in its own terms. */
  readonly affinityKey: string;
  /** Whether the heuristic picker means anything for this algorithm. */
  readonly usesHeuristic: boolean;
  readonly priority: (node: FrontierNode) => number;
  /** The arithmetic behind one cell's score -- math notation, not prose, so
   *  this stays plain text rather than a translation key. */
  readonly score: (node: FrontierNode) => string;
  /** The priority rule as LaTeX, and the same rule with numbers filled in. */
  readonly scoreTex: string;
  readonly scoreTexFor: (node: FrontierNode) => string;
};

export const round = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

export const ALGORITHMS: Record<AlgorithmId, Algorithm> = {
  astar: {
    id: 'astar',
    nameKey: 'algorithm.astar.name',
    blurbKey: 'algorithm.astar.blurb',
    affinityKey: 'algorithm.astar.affinity',
    usesHeuristic: true,
    priority: ({ g, h }) => g + h,
    score: ({ g, h }) => `f = ${round(g)} + ${round(h)} = ${round(g + h)}`,
    scoreTex: 'f = g + h',
    scoreTexFor: ({ g, h }) => `f = ${round(g)} + ${round(h)} = ${round(g + h)}`
  },
  dijkstra: {
    id: 'dijkstra',
    nameKey: 'algorithm.dijkstra.name',
    blurbKey: 'algorithm.dijkstra.blurb',
    affinityKey: 'algorithm.dijkstra.affinity',
    usesHeuristic: false,
    priority: ({ g }) => g,
    score: ({ g }) => `g = ${round(g)}`,
    scoreTex: 'f = g \\quad (h \\text{ is unused})',
    scoreTexFor: ({ g }) => `f = g = ${round(g)}`
  },
  greedy: {
    id: 'greedy',
    nameKey: 'algorithm.greedy.name',
    blurbKey: 'algorithm.greedy.blurb',
    affinityKey: 'algorithm.greedy.affinity',
    usesHeuristic: true,
    priority: ({ h }) => h,
    score: ({ h }) => `h = ${round(h)}`,
    scoreTex: 'f = h \\quad (g \\text{ is ignored})',
    scoreTexFor: ({ h }) => `f = h = ${round(h)}`
  },
  bfs: {
    id: 'bfs',
    nameKey: 'algorithm.bfs.name',
    blurbKey: 'algorithm.bfs.blurb',
    affinityKey: 'algorithm.bfs.affinity',
    usesHeuristic: false,
    priority: ({ order }) => order,
    score: ({ order }) => `${ordinal(order + 1)} cell discovered`,
    scoreTex: 'f = \\text{discovery order}',
    scoreTexFor: ({ order }) => `f = ${order + 1}`
  }
};

export const ALGORITHM_IDS = Object.keys(ALGORITHMS) as AlgorithmId[];

export const DEFAULT_ALGORITHM: AlgorithmId = 'astar';

function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}
