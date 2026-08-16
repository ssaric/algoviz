import type { AlgorithmId } from './algorithms';
import { combTrap, FRONTIER_DEMO, OPEN_DIAGONAL, OPEN_STRAIGHT } from './boards';
import type { SerializedGrid } from './Grid';
import type { HeuristicSpec } from './heuristics';

export type LessonVariant = {
  readonly label: string;
  readonly algorithm: AlgorithmId;
  readonly heuristic: HeuristicSpec;
};

/**
 * How a lesson's board area is laid out.
 *
 * `frontier` shows one board next to a live view of its priority queue --
 * for introducing what a search actually does before there is a second
 * strategy to compare it against. `compare` is the side-by-side, two-boards-
 * one-clock format the rest of the lessons use. `scoreboard` has no live
 * board at all: it is the zoom-out, several configurations at once, and a
 * chart reads better there than another animation.
 */
export type LessonLayout = 'frontier' | 'compare' | 'scoreboard';

export type Lesson = {
  readonly id: string;
  readonly title: string;
  /** One line for the lesson list. */
  readonly hook: string;
  /** What to watch while the board(s) run. */
  readonly watchFor: string;
  readonly layout: LessonLayout;
  readonly board: SerializedGrid;
  /** Exactly one for `frontier`, exactly two for `compare`, two or more for
   *  `scoreboard`. Checked in lessons.test.ts rather than in the type, since a
   *  fixed-length tuple can't flex across all three layouts. */
  readonly variants: readonly LessonVariant[];
  readonly body: readonly string[];
};

const MANHATTAN: HeuristicSpec = { kind: 'manhattan' };

export const LESSONS: readonly Lesson[] = [
  {
    id: 'meet-the-frontier',
    title: 'Meet the frontier: Dijkstra explores blindly',
    hook: 'Watch the actual priority queue. Cheapest cell reached so far always goes next.',
    watchFor:
      'The list on the right is the frontier: every cell that has been found but not yet expanded, ranked by how it will be picked. Watch the highlighted row -- that is what happens next.',
    layout: 'frontier',
    board: FRONTIER_DEMO,
    variants: [{ label: 'Dijkstra · no heuristic', algorithm: 'dijkstra', heuristic: MANHATTAN }],
    body: [
      'Every search in this app keeps two sets of cells: settled ones it is done with, and a frontier of cells it has found but not yet looked at. Each step is the same three-part move: take the best cell off the frontier, mark it settled, then look at its neighbours -- any that are new go onto the frontier, and any already there get re-ranked if this route to them is cheaper. Dijkstra\'s algorithm is the plainest version of this loop: "best" simply means cheapest to reach from the start, $g$.',
      'That is what the panel on the right is showing, live. It lists every cell currently on the frontier, ordered by that score, with the top row -- the one about to be popped -- highlighted. Nothing about it involves the goal. Dijkstra does not know where the goal is, or even that it exists as anything special; it just always expands whatever is closest to where it began.',
      'Watch what that produces: the frontier grows outward from the start in a ring, roughly one cell added for every one settled, because on this grid every move costs exactly 1. Two cells at the same distance are genuinely tied, and the highlighted row is not making a clever choice between them -- it is breaking an arbitrary tie the same way every time, which is why the shape comes out so even.',
      'Scrub the timeline back and forth and read the panel at a few different points. At any instant, the top of the list is not a guess about what happens next -- it is exactly what happens next. That is the whole algorithm: no lookahead, no strategy, just always take the cheapest thing you know about.'
    ]
  },
  {
    id: 'adding-a-heuristic',
    title: 'Adding a heuristic: how A* biases the frontier',
    hook: 'Same board, same frontier mechanics -- but now the queue leans towards the goal.',
    watchFor:
      'The frontier list works exactly as before, but the score next to each cell is now $f = g + h$. Compare which row sits on top here against where Dijkstra would have picked.',
    layout: 'frontier',
    board: FRONTIER_DEMO,
    variants: [{ label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN }],
    body: [
      'A* runs the identical loop as the previous lesson -- take the best frontier cell, settle it, rank its neighbours -- with one change: "best" now also weighs an estimate of what is left. Each cell\'s score becomes $f = g + h$, cost so far plus guessed cost remaining, and $h$ is where the goal enters the picture for the first time.',
      'Look at the frontier panel with that in mind. It is the same list, the same live ranking, the same highlighted next pick -- but the numbers next to each cell are no longer just "how far have I come." A cell that is expensive to reach but sits right next to the goal can now outrank one that was cheap to reach but points away from it. That is the entire mechanism behind A* looking like it is "aiming": nothing is steering it, the score just now contains a term that happens to reward getting closer.',
      "Run this lesson and the previous one side by side in your head. Dijkstra's frontier grew into a ring around the start, because every direction looked equally promising. Here, watch how lopsided the frontier gets almost immediately -- rows on the side facing the goal consistently outscore rows on the far side, so the search barely bothers with the far side at all.",
      'This is also the moment to notice what did not change. The rules for discovering a neighbour, re-ranking one that turns out cheaper, and settling the winner are exactly the ones from the Dijkstra lesson. A* is not a different algorithm bolted on top -- it is the same frontier-driven loop with one extra number added to the score. The next several lessons are all about what happens when that one number, $h$, is a good estimate, a bad one, or entirely absent.'
    ]
  },
  {
    id: 'exact-vs-optimistic',
    title: 'An exact heuristic beats an optimistic one',
    hook: 'Same path, ten times the work. Why Euclidean makes A* fan out.',
    watchFor:
      'Both boards find the same 43-cell path. Watch how much green each one has to turn over to get there.',
    layout: 'compare',
    board: OPEN_DIAGONAL,
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'A* · Euclidean', algorithm: 'astar', heuristic: { kind: 'euclidean' } }
    ],
    body: [
      'A* must expand every cell whose $f = g + h$ is strictly below the cost of the best path, $C^*$ -- a cell claiming $f = 38$ when the best known route costs 43 is claiming it might lead somewhere cheaper, and A* cannot rule that out without looking. It only gets to stop once everything left claims $f$ of at least $C^*$. So the whole question the last two lessons were building towards becomes: how many cells does your heuristic drag below $C^*$?',
      'On this grid you may only move up, down, left and right, which means the true remaining distance from any cell is exactly $\\lvert \\Delta x \\rvert + \\lvert \\Delta y \\rvert$ — the Manhattan distance. Manhattan is therefore not an estimate at all. It is the answer. Every cell on an optimal path scores exactly $C^*$, and every cell off one scores more. The set of cells A* is forced to expand is empty, so it walks the corridor and stops.',
      'Euclidean measures the straight line between two points, but you cannot walk straight lines here. For a diagonal offset it reports about 71% of the real distance: from ten across and ten down it says 14.14 where the truth is 20. Understating h by that much pushes $g + h$ below $C^*$ across a whole lens-shaped region between start and goal, and every cell in that region now has to be expanded. That is the blob on the right.',
      'Euclidean is not broken. It never overestimates, which is the property called admissibility, and that is what guarantees the path it returns is genuinely shortest — both boards return the same 43 cells. It is simply less informed, and it pays for the weaker estimate with roughly ten times the work.'
    ]
  },
  {
    id: 'hidden-on-axis',
    title: 'Why you would never notice on a straight line',
    hook: 'The same two heuristics, now indistinguishable. The bug hides on axis-aligned tests.',
    watchFor: 'Nothing differs. Both boards expand exactly the same cells in the same order.',
    layout: 'compare',
    board: OPEN_STRAIGHT,
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'A* · Euclidean', algorithm: 'astar', heuristic: { kind: 'euclidean' } }
    ],
    body: [
      'This is the previous lesson with one change: the start and the goal now share a row. The dramatic difference is gone, and the two searches are identical down to the last cell.',
      'The reason is arithmetic. Euclidean distance is $\\sqrt{\\Delta x^{2} + \\Delta y^{2}}$. When the offset is purely horizontal, $\\Delta y$ is zero and that collapses to $\\sqrt{\\Delta x^{2}} = \\lvert \\Delta x \\rvert$, which is exactly the Manhattan distance. The same holds for a purely vertical offset. The two heuristics agree perfectly whenever the goal is directly along a row or a column, and they disagree most on the diagonal, where Euclidean returns $\\sqrt{2}\\,d$ against a true $2d$ — about 71%.',
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
    layout: 'compare',
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
      'The catch is that the guarantee came from never overestimating. An admissible heuristic can promise that when A* reaches the goal, no cheaper route survives on the frontier. Once $h$ can overstate the remaining distance, a cell on the genuinely shortest path can be assigned a score so pessimistic that A* settles for something else and never comes back to it. The search still terminates, and it still returns a path. It is simply no longer the shortest one.',
      "This board makes it happen. The corridor along the goal's row is about twice as long as the open bypass above it, but it hugs the goal the whole way. With $h$ swamping $g$, A* stops weighing the cost of travel almost entirely, dives into the corridor and commits. The result is 63 cells against a possible 31.",
      'The uncomfortable part is not that it fails, but how it fails. On the open board it was faster and still correct. It gives no warning at all until the board has a shape that punishes it, at which point it quietly returns a worse answer rather than an error.'
    ]
  },
  {
    id: 'greedy-takes-the-bait',
    title: 'Greedy best-first takes the bait',
    hook: 'Ignoring the distance already travelled is a decision, and this board charges for it.',
    watchFor:
      'Greedy dives straight into the corridor because every cell in it looks closer to the goal. A* pays the extra cost up front and goes over the top.',
    layout: 'compare',
    board: combTrap(),
    variants: [
      { label: 'A* · g + h', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'Greedy · h only', algorithm: 'greedy', heuristic: MANHATTAN }
    ],
    body: [
      'Greedy best-first is A* with the $g$ term deleted. It orders the frontier purely by what looks closest to the goal, and never accounts for what reaching a cell has already cost. On open ground that is a fine bet and it beelines beautifully. This board is built to charge for it.',
      "The corridor running along the goal's row snakes up and down between teeth, so crossing it costs four vertical moves for every two columns of progress — roughly twice the length of the clear bypass above. But every cell inside the corridor sits closer to the goal than any cell on the bypass, because the bypass first has to climb away from the goal's row. Greedy sees only that, so it goes in.",
      'It is worth being precise about what greedy does next, because it is not simple hill-climbing. It keeps a global frontier and will happily back out of a dead end by expanding somewhere else entirely. What sinks it here is subtler: the route that reaches the goal first is the one that kept $h$ lowest along the way, and that is the corridor. The path it returns is the chain of parents behind that arrival — 63 cells against a possible 31.',
      'A* avoids it for one reason. As the corridor snakes, $g$ climbs fast, so $f$ climbs with it; meanwhile the bypass costs a few cells of climb and then runs flat. Around the point where the corridor has zigzagged enough, the bypass becomes the cheaper prospect and A* switches. Counting what you have already spent is what makes the difference.'
    ]
  },
  {
    id: 'dijkstra-ignores-the-goal',
    title: 'Dijkstra does not know where it is going',
    hook: 'No heuristic at all: a spreading disc instead of a cone. Same path, fourteen times the work.',
    watchFor:
      'A* sweeps a cone towards the goal. Dijkstra grows an even disc outwards from the start, expanding cells in the wrong direction entirely.',
    layout: 'compare',
    board: OPEN_DIAGONAL,
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'Dijkstra · no heuristic', algorithm: 'dijkstra', heuristic: MANHATTAN }
    ],
    body: [
      'This is the frontier from the first lesson, back at full scale. Dijkstra orders its frontier by $g$ alone: always expand the cheapest cell reached so far. It has no notion of where the goal is, so it cannot prefer one direction over another, and it grows an even disc outwards from the start exactly the way the frontier panel showed earlier -- just over a board too large to watch one row at a time.',
      "That is why it expands 615 cells here against A*'s 43, while both return the same 43-cell path. Most of Dijkstra's work goes into cells pointing away from the goal — cells A* never even looked at, because their $f$ scores put them out of contention immediately.",
      'The two are the same algorithm. Dijkstra is A* with $h = 0$, sitting at the bottom of a ladder: Manhattan is exact and expands only the corridor, Euclidean underestimates and expands a blob, and $h = 0$ knows nothing and expands everything within reach. The formal statement is dominance — for two admissible heuristics, if $h_1$ is at least $h_2$ everywhere, then A* with $h_1$ expands a subset of what $h_2$ expands. Manhattan dominates Euclidean, which dominates zero.',
      'None of this makes Dijkstra a worse algorithm, only a differently-scoped one. It is what you use when there is no goal to aim at, or many goals at once: after one run it holds the shortest distance to every cell it touched, not just to one of them. A* buys its speed by giving that up.'
    ]
  },
  {
    id: 'same-search-three-names',
    title: 'Three searches that are secretly one search',
    hook: 'Breadth-first and Dijkstra are not merely similar here. They are identical.',
    watchFor: 'The two boards stay in lockstep for all 1,843 steps. Nothing about them differs.',
    layout: 'compare',
    board: OPEN_DIAGONAL,
    variants: [
      { label: 'Dijkstra · lowest g', algorithm: 'dijkstra', heuristic: MANHATTAN },
      { label: 'Breadth-first · discovery order', algorithm: 'bfs', heuristic: MANHATTAN }
    ],
    body: [
      'Breadth-first search takes cells off the frontier in the order it found them; Dijkstra takes the one with the smallest cost from the start. Those are different rules, and on a graph with varying edge costs they produce genuinely different searches.',
      'On this grid every move costs exactly one. That makes discovery order and increasing distance the same ordering: a cell found on the nth wave is exactly n steps from the start, so the queue is already sorted by cost. The two rules cannot come apart. They expand the same 615 cells, in the same order, over the same 1,843 steps — this is asserted in the test suite, not just observed.',
      "A third member belongs in the same family. A* with $h = 0$ scores every cell by $f = g + 0 = g$, which is precisely Dijkstra's rule, and it too produces an identical run. You can try it yourself: pick Custom in the Sandbox and enter 0.",
      'All four searches in this app are one best-first loop that differs only in the priority it assigns a cell — $g + h$, $g$, $h$, or discovery order. Seen that way they are not four algorithms to memorise but four points in one design space, and under uniform costs three of them fall together.'
    ]
  },
  {
    id: 'speed-vs-correctness',
    title: 'The tradeoff, all at once',
    hook: 'Five strategies on one board: how much each explores, and whether the answer was even right.',
    watchFor:
      'The left chart is speed; the right one is correctness. Notice that the two fast, cheap runs are exactly the two that got the wrong answer.',
    layout: 'scoreboard',
    board: combTrap(),
    variants: [
      { label: 'A* · Manhattan', algorithm: 'astar', heuristic: MANHATTAN },
      { label: 'A* · Euclidean', algorithm: 'astar', heuristic: { kind: 'euclidean' } },
      {
        label: 'A* · Euclidean squared',
        algorithm: 'astar',
        heuristic: { kind: 'euclidean-squared' }
      },
      { label: 'Dijkstra', algorithm: 'dijkstra', heuristic: MANHATTAN },
      { label: 'Greedy best-first', algorithm: 'greedy', heuristic: MANHATTAN }
    ],
    body: [
      'Every earlier lesson picked two strategies and put them side by side. This one puts all five on the same board at once, because the pairwise view hides the actual shape of the tradeoff: it is not a straight line from "slow and correct" to "fast and wrong."',
      'Look at the two charts together. Dijkstra sits at one extreme: the most expanding by far, and always correct, because it never guesses. Manhattan gets the same correct answer for a small fraction of the work, because on this grid it is not really guessing either -- it is computing the real remaining distance. Between those two, Euclidean spends more than Manhattan to buy nothing: same correct answer, several times the work, purely because its estimate is weaker.',
      "Then look at the other two. Euclidean squared and greedy best-first are both cheap -- competitive with Manhattan on the speed chart -- and both wrong, landing on a path twice as long as necessary. Cheap and wrong is exactly as available as cheap and right, and nothing about the speed chart alone tells you which one you are looking at. That is the entire reason the two charts are shown side by side rather than one number per strategy: a heuristic's cost has to be read against whether it is still admissible, not against its speed in isolation.",
      'The practical version of this lesson: an inadmissible heuristic is not a slower, safer version of a good one, and it is not simply "the fast option." It is a different kind of bet -- usually cheap, occasionally wrong -- and the board it is wrong on rarely looks unusual until after the fact. Manhattan is not on this chart because it is the safe choice; it is here because, on a four-way grid, it happens to be free: the exact remaining distance, at no extra cost over guessing.'
    ]
  }
];

export const DEFAULT_LESSON_ID = LESSONS[0].id;

export function findLesson(id: string | null | undefined): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}
