import type { AlgorithmId } from './algorithms';
import { combTrap, OPEN_DIAGONAL, OPEN_STRAIGHT } from './boards';
import type { SerializedGrid } from './Grid';
import type { HeuristicSpec } from './heuristics';

export type LessonVariant = {
  readonly label: string;
  readonly algorithm: AlgorithmId;
  readonly heuristic: HeuristicSpec;
};

export type Lesson = {
  readonly id: string;
  readonly title: string;
  /** One line for the lesson list. */
  readonly hook: string;
  /** What to watch while the two boards run. */
  readonly watchFor: string;
  readonly board: SerializedGrid;
  readonly variants: readonly [LessonVariant, LessonVariant];
  readonly body: readonly string[];
};

const MANHATTAN: HeuristicSpec = { kind: 'manhattan' };

export const LESSONS: readonly Lesson[] = [
  {
    id: 'exact-vs-optimistic',
    title: 'An exact heuristic beats an optimistic one',
    hook: 'Same path, ten times the work. Why Euclidean makes A* fan out.',
    watchFor:
      'Both boards find the same 43-cell path. Watch how much green each one has to turn over to get there.',
    board: OPEN_DIAGONAL,
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'A* · Euclidean', algorithm: 'astar', heuristic: { kind: 'euclidean' } }
    ],
    body: [
      'A* expands cells in order of f = g + h, where g is what the route so far has cost and h is the guess at what is left. The rule that decides how much work it does is not a tuning choice: A* must expand every cell whose f is strictly below the cost of the best path, C*. A cell claiming f = 38 when the best known route costs 43 is claiming it might lead somewhere cheaper, and A* cannot rule that out without looking. It gets to stop only once everything remaining claims f of at least C*.',
      'So the whole question becomes: how many cells does your heuristic drag below C*? On this grid you may only move up, down, left and right, which means the true remaining distance from any cell is exactly |dx| + |dy| — the Manhattan distance. Manhattan is therefore not an estimate at all. It is the answer. Every cell on an optimal path scores exactly C*, and every cell off one scores more. The set of cells A* is forced to expand is empty, so it walks the corridor and stops.',
      'Euclidean measures the straight line between two points, but you cannot walk straight lines here. For a diagonal offset it reports about 71% of the real distance: from ten across and ten down it says 14.14 where the truth is 20. Understating h by that much pushes g + h below C* across a whole lens-shaped region between start and goal, and every cell in that region now has to be expanded. That is the blob on the right.',
      'Euclidean is not broken. It never overestimates, which is the property called admissibility, and that is what guarantees the path it returns is genuinely shortest — both boards return the same 43 cells. It is simply less informed, and it pays for the weaker estimate with roughly ten times the work.'
    ]
  },
  {
    id: 'hidden-on-axis',
    title: 'Why you would never notice on a straight line',
    hook: 'The same two heuristics, now indistinguishable. The bug hides on axis-aligned tests.',
    watchFor: 'Nothing differs. Both boards expand exactly the same cells in the same order.',
    board: OPEN_STRAIGHT,
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'A* · Euclidean', algorithm: 'astar', heuristic: { kind: 'euclidean' } }
    ],
    body: [
      'This is the previous lesson with one change: the start and the goal now share a row. The dramatic difference is gone, and the two searches are identical down to the last cell.',
      'The reason is arithmetic. Euclidean distance is sqrt(dx² + dy²). When the offset is purely horizontal, dy is zero and that collapses to sqrt(dx²) = |dx|, which is exactly the Manhattan distance. The same holds for a purely vertical offset. The two heuristics agree perfectly whenever the goal is directly along a row or a column, and they disagree most on the diagonal, where Euclidean returns sqrt(2)·d against a true 2·d — about 71%.',
      'Offset (20, 0): true 20, Manhattan 20, Euclidean 20.00. Offset (16, 4): true 20, Manhattan 20, Euclidean 16.49. Offset (10, 10): true 20, Manhattan 20, Euclidean 14.14. The error grows as the offset turns away from an axis and vanishes when it lines up with one.',
      'This is worth knowing beyond pathfinding. A heuristic that is wrong only off-axis will look perfect in any test where you put the goal straight ahead of the start, which is exactly the test somebody writes first.'
    ]
  },
  {
    id: 'overestimating-breaks-it',
    title: 'Overestimating buys speed with correctness',
    hook: 'Euclidean squared explores less and comes back with a path twice as long.',
    watchFor:
      'The board on the right finishes with far less exploring — and a path of 63 cells where 31 was possible.',
    board: combTrap(),
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      {
        label: 'A* · Euclidean squared',
        algorithm: 'astar',
        heuristic: { kind: 'euclidean-squared' }
      }
    ],
    body: [
      'If underestimating makes A* explore too much, the obvious move is to overestimate. Squaring the Euclidean distance does that emphatically: where the true remaining distance is 7 it reports 25, and where the truth is 20 it reports 200. On an open board the effect looks wonderful — A* stops hedging and drives at the goal, expanding 43 cells where plain Euclidean expanded 470.',
      'The catch is that the guarantee came from never overestimating. An admissible heuristic can promise that when A* reaches the goal, no cheaper route survives on the frontier. Once h can overstate the remaining distance, a cell on the genuinely shortest path can be assigned a score so pessimistic that A* settles for something else and never comes back to it. The search still terminates, and it still returns a path. It is simply no longer the shortest one.',
      "This board makes it happen. The corridor along the goal's row is about twice as long as the open bypass above it, but it hugs the goal the whole way. With h swamping g, A* stops weighing the cost of travel almost entirely, dives into the corridor and commits. The result is 63 cells against a possible 31.",
      'The uncomfortable part is not that it fails, but how it fails. On the open board it was faster and still correct. It gives no warning at all until the board has a shape that punishes it, at which point it quietly returns a worse answer rather than an error.'
    ]
  },
  {
    id: 'greedy-takes-the-bait',
    title: 'Greedy best-first takes the bait',
    hook: 'Ignoring the distance already travelled is a decision, and this board charges for it.',
    watchFor:
      'Greedy dives straight into the corridor because every cell in it looks closer to the goal. A* pays the extra cost up front and goes over the top.',
    board: combTrap(),
    variants: [
      { label: 'A* · g + h', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'Greedy · h only', algorithm: 'greedy', heuristic: MANHATTAN }
    ],
    body: [
      'Greedy best-first is A* with the g term deleted. It orders the frontier purely by what looks closest to the goal, and never accounts for what reaching a cell has already cost. On open ground that is a fine bet and it beelines beautifully. This board is built to charge for it.',
      "The corridor running along the goal's row snakes up and down between teeth, so crossing it costs four vertical moves for every two columns of progress — roughly twice the length of the clear bypass above. But every cell inside the corridor sits closer to the goal than any cell on the bypass, because the bypass first has to climb away from the goal's row. Greedy sees only that, so it goes in.",
      'It is worth being precise about what greedy does next, because it is not simple hill-climbing. It keeps a global frontier and will happily back out of a dead end by expanding somewhere else entirely. What sinks it here is subtler: the route that reaches the goal first is the one that kept h lowest along the way, and that is the corridor. The path it returns is the chain of parents behind that arrival — 63 cells against a possible 31.',
      'A* avoids it for one reason. As the corridor snakes, g climbs fast, so f climbs with it; meanwhile the bypass costs a few cells of climb and then runs flat. Around the point where the corridor has zigzagged enough, the bypass becomes the cheaper prospect and A* switches. Counting what you have already spent is what makes the difference.'
    ]
  },
  {
    id: 'dijkstra-ignores-the-goal',
    title: 'Dijkstra does not know where it is going',
    hook: 'No heuristic at all: a spreading disc instead of a cone. Same path, fourteen times the work.',
    watchFor:
      'A* sweeps a cone towards the goal. Dijkstra grows an even disc outwards from the start, expanding cells in the wrong direction entirely.',
    board: OPEN_DIAGONAL,
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'Dijkstra · no heuristic', algorithm: 'dijkstra', heuristic: MANHATTAN }
    ],
    body: [
      'Dijkstra orders its frontier by g alone: always expand the cheapest cell reached so far. It has no notion of where the goal is, so it cannot prefer one direction over another. It expands everything reachable within a given cost before it considers anything more expensive, which on a uniform grid grows an even disc outwards from the start.',
      "That is why it expands 615 cells here against A*'s 43, while both return the same 43-cell path. Most of Dijkstra's work goes into cells pointing away from the goal — cells A* never even looked at, because their f scores put them out of contention immediately.",
      'The two are the same algorithm. Dijkstra is A* with h = 0, sitting at the bottom of a ladder: Manhattan is exact and expands only the corridor, Euclidean underestimates and expands a blob, and h = 0 knows nothing and expands everything within reach. The formal statement is dominance — for two admissible heuristics, if h₁ is at least h₂ everywhere, then A* with h₁ expands a subset of what h₂ expands. Manhattan dominates Euclidean, which dominates zero.',
      'None of this makes Dijkstra a worse algorithm, only a differently-scoped one. It is what you use when there is no goal to aim at, or many goals at once: after one run it holds the shortest distance to every cell it touched, not just to one of them. A* buys its speed by giving that up.'
    ]
  },
  {
    id: 'same-search-three-names',
    title: 'Three searches that are secretly one search',
    hook: 'Breadth-first and Dijkstra are not merely similar here. They are identical.',
    watchFor: 'The two boards stay in lockstep for all 1,843 steps. Nothing about them differs.',
    board: OPEN_DIAGONAL,
    variants: [
      { label: 'Dijkstra · lowest g', algorithm: 'dijkstra', heuristic: MANHATTAN },
      { label: 'Breadth-first · discovery order', algorithm: 'bfs', heuristic: MANHATTAN }
    ],
    body: [
      'Breadth-first search takes cells off the frontier in the order it found them; Dijkstra takes the one with the smallest cost from the start. Those are different rules, and on a graph with varying edge costs they produce genuinely different searches.',
      'On this grid every move costs exactly one. That makes discovery order and increasing distance the same ordering: a cell found on the nth wave is exactly n steps from the start, so the queue is already sorted by cost. The two rules cannot come apart. They expand the same 615 cells, in the same order, over the same 1,843 steps — this is asserted in the test suite, not just observed.',
      "A third member belongs in the same family. A* with h = 0 scores every cell by f = g + 0 = g, which is precisely Dijkstra's rule, and it too produces an identical run. You can try it yourself: pick Custom in the Sandbox and enter 0.",
      'All four searches in this app are one best-first loop that differs only in the priority it assigns a cell — g + h, g, h, or discovery order. Seen that way they are not four algorithms to memorise but four points in one design space, and under uniform costs three of them fall together.'
    ]
  }
];

export const DEFAULT_LESSON_ID = LESSONS[0].id;

export function findLesson(id: string | null | undefined): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}
