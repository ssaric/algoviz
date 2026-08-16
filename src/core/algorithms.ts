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
  readonly name: string;
  readonly blurb: string;
  /** Whether the heuristic picker means anything for this algorithm. */
  readonly usesHeuristic: boolean;
  readonly priority: (node: FrontierNode) => number;
  /** What makes a cell attractive to this algorithm, in its own terms. */
  readonly affinity: string;
  /** The arithmetic behind one cell's score. */
  readonly score: (node: FrontierNode) => string;
  /** The priority rule as LaTeX, and the same rule with numbers filled in. */
  readonly scoreTex: string;
  readonly scoreTexFor: (node: FrontierNode) => string;
};

const round = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

export const ALGORITHMS: Record<AlgorithmId, Algorithm> = {
  astar: {
    id: 'astar',
    name: 'A*',
    blurb:
      'Balances distance travelled against distance remaining. Finds the shortest path while aiming at the goal.',
    usesHeuristic: true,
    priority: ({ g, h }) => g + h,
    affinity: 'it has the best f = g + h score on the frontier',
    score: ({ g, h }) => `f = ${round(g)} + ${round(h)} = ${round(g + h)}`,
    scoreTex: 'f = g + h',
    scoreTexFor: ({ g, h }) => `f = ${round(g)} + ${round(h)} = ${round(g + h)}`
  },
  dijkstra: {
    id: 'dijkstra',
    name: 'Dijkstra',
    blurb:
      'Always expands the cheapest cell reached so far, ignoring where the goal is. Finds the shortest path, but spreads out in every direction.',
    usesHeuristic: false,
    priority: ({ g }) => g,
    affinity: 'it is the cheapest cell reached so far, and where the goal sits is not considered',
    score: ({ g }) => `g = ${round(g)}`,
    scoreTex: 'f = g \\quad (h \\text{ is unused})',
    scoreTexFor: ({ g }) => `f = g = ${round(g)}`
  },
  greedy: {
    id: 'greedy',
    name: 'Greedy best-first',
    blurb:
      'Always jumps to whatever looks closest to the goal, ignoring the distance already travelled. Fast, but the path it finds may not be the shortest.',
    usesHeuristic: true,
    priority: ({ h }) => h,
    affinity: 'it looks closest to the goal, and the distance already travelled is ignored',
    score: ({ h }) => `h = ${round(h)}`,
    scoreTex: 'f = h \\quad (g \\text{ is ignored})',
    scoreTexFor: ({ h }) => `f = h = ${round(h)}`
  },
  bfs: {
    id: 'bfs',
    name: 'Breadth-first',
    blurb:
      'Expands cells in the order it found them, treating every move as equal. Explores in rings outwards from the start.',
    usesHeuristic: false,
    priority: ({ order }) => order,
    affinity: 'it has waited on the frontier longest, and every move costs the same',
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
