/**
 * The actual words for every lesson, kept apart from the structural data in
 * core/lessons.ts (which board, which algorithms, which layout). This is the
 * one file a future locale would replace -- see LessonContent for the shape
 * it would need to match.
 */
export type LessonContent = {
  readonly title: string;
  /** One line for the lesson list. */
  readonly hook: string;
  /** What to watch while the board(s) run. */
  readonly watchFor: string;
  readonly body: readonly string[];
  /** Parallel to the lesson's `variants`, in the same order. */
  readonly variantLabels: readonly string[];
};

export const LESSON_CONTENT_EN: Record<string, LessonContent> = {
  'why-pathfinding': {
    title: 'Why bother? Getting from A to B without walking into a wall',
    hook: "Every game NPC and GPS app solves this. Let's meet g, h, and f.",
    watchFor:
      'The numbers next to each waiting cell are g, h and f -- the three ingredients from this lesson. Whichever is smallest gets picked next.',
    body: [
      'Picture a game character that needs to cross a map without walking through furniture. Or a GPS app finding you a route that isn\'t three hours longer than it has to be. Or a warehouse robot dodging shelves. Different costumes, same puzzle underneath: given a map and two points, find a cheap way from one to the other. That puzzle is pathfinding, and A* (say "A-star") is the algorithm almost everyone reaches for first -- it\'s the one this whole app is built around.',
      "To solve it, a search needs to track two numbers for every cell it looks at. The first is g: how far you've actually walked to get here, in real steps from the start. It's not a guess -- it's exactly the cost of the cheapest route found so far.",
      "The second number, h, is a guess: roughly how far is left to the goal from here. It's called a heuristic -- a rule of thumb, not a fact. A simple one on a grid just counts rows and columns to the goal and ignores walls entirely. It's usually wrong, but being roughly right is exactly what makes it useful.",
      'Add them together and you get f = g + h: cost so far, plus guessed cost left. That\'s the whole trick. A search with no h at all -- that\'s Dijkstra, next lesson -- has no way to prefer one cell over another, so it fans out evenly in every direction like a spreading puddle. Give it a decent h, and it suddenly has an opinion: cells that look closer to the goal jump to the front of the queue, and the puddle turns into a beeline. That\'s the entire reason heuristics exist -- they turn "search everywhere" into "search toward the thing you actually want."',
      "The board below is already running A*, and the queue on the right is showing g, h and f live as the search goes. Don't worry about reading every number yet -- the next couple of lessons walk through exactly how that queue decides what happens next. For now, just notice that f is the one doing the deciding."
    ],
    variantLabels: ['A* · Manhattan']
  },
  'meet-the-frontier': {
    title: "Meet the frontier: Dijkstra can't see the goal",
    hook: 'Watch the actual priority queue. Cheapest cell reached so far always goes next.',
    watchFor:
      'The list on the right is the frontier: every cell that has been found but not yet expanded, ranked by how it will be picked. Watch the highlighted row -- that is what happens next.',
    body: [
      "Every search in this app keeps two piles of cells: ones it's completely done with, and a frontier -- cells it's found but hasn't looked at yet. Each step is the same three-part move: grab the best cell off the frontier, mark it done, then check its neighbours. New ones join the frontier; ones already there get re-ranked if this route to them turns out cheaper. Dijkstra's algorithm is the simplest version of this loop: \"best\" just means cheapest to reach from the start -- that's g.",
      "That's exactly what the panel on the right is showing you, live. Every cell currently on the frontier, sorted by that score, with the row about to get popped highlighted. Notice nothing here involves the goal at all -- Dijkstra doesn't know where it is, or that it's anything special. It just always expands whatever's closest to where it started.",
      "Watch what that produces: the frontier grows outward from the start like a ripple, roughly one cell added for every one settled, because every move here costs exactly 1. When two cells are the same distance away, it really is a tie -- the highlighted row isn't being clever, it just breaks ties the same way every time, which is why the shape comes out so even.",
      "Scrub the timeline back and forth and check the panel at a few points. At any instant, the top of that list isn't a guess about what happens next -- it IS what happens next. That's the whole algorithm: no lookahead, no strategy, just always grab the cheapest thing you know about."
    ],
    variantLabels: ['Dijkstra · no heuristic']
  },
  'adding-a-heuristic': {
    title: 'Adding a heuristic: A* leans the frontier toward the goal',
    hook: 'Same board, same frontier mechanics -- but now the queue leans towards the goal.',
    watchFor:
      'The frontier list works exactly as before, but the score next to each cell is now $f = g + h$. Compare which row sits on top here against where Dijkstra would have picked.',
    body: [
      'A* runs the exact same loop as the last lesson -- grab the best frontier cell, settle it, rank its neighbours -- with one twist: "best" now also factors in a guess about what\'s left. Each cell\'s score becomes $f = g + h$, cost so far plus guessed cost remaining, and $h$ is where the goal finally enters the picture.',
      'Look at the frontier panel with that in mind. Same list, same live ranking, same highlighted pick -- but the numbers next to each cell aren\'t just "how far have I come" anymore. A cell that\'s expensive to reach but sits right next to the goal can now beat one that was cheap to reach but points the wrong way. That\'s the entire trick behind A* looking like it\'s "aiming" -- nothing is steering it on purpose, the score just now rewards getting closer.',
      "Run this lesson and the last one back to back in your head. Dijkstra's frontier grew into a ring around the start because every direction looked equally promising. Here, watch how lopsided it gets almost immediately -- cells facing the goal keep outscoring cells on the far side, so the search barely bothers with that side at all.",
      "Worth noticing what didn't change, too. Discovering a neighbour, re-ranking a cheaper route, settling the winner -- all identical to the Dijkstra lesson. A* isn't a different algorithm bolted on top; it's the same frontier loop with one extra number added to the score. The next few lessons are all about what happens when that number, $h$, is a good guess, a bad one, or missing entirely."
    ],
    variantLabels: ['A* · Manhattan']
  },
  'exact-vs-optimistic': {
    title: 'An exact heuristic beats an optimistic one',
    hook: 'Same path, ten times the work. Why Euclidean makes A* fan out.',
    watchFor:
      'Both boards find the same 43-cell path. Watch how much green each one has to turn over to get there.',
    body: [
      "A* has to expand every cell whose $f = g + h$ comes in strictly below the cost of the best path, $C^*$. A cell claiming $f = 38$ when the best known route costs 43 is claiming it might lead somewhere cheaper, and A* can't rule that out without checking. It only gets to stop once everything left claims an $f$ of at least $C^*$. So the real question becomes: how many cells does your heuristic drag below $C^*$?",
      "On this grid you can only move up, down, left and right, so the true remaining distance from any cell is exactly $\\lvert \\Delta x \\rvert + \\lvert \\Delta y \\rvert$ — the Manhattan distance. Manhattan isn't really estimating anything here, it IS the answer. Every cell on an optimal path scores exactly $C^*$, and every cell off one scores more. There is nothing left for A* to be forced into expanding, so it just walks the corridor and stops.",
      "Euclidean measures the straight line between two points, but you can't actually walk straight lines here. For a diagonal offset it reports about 71% of the real distance -- ten across and ten down comes back as 14.14 when the truth is 20. Underselling $h$ by that much drags $g + h$ below $C^*$ across a whole lens-shaped region between start and goal, and every cell in that region now has to get expanded. That blob on the right is the bill for the underestimate.",
      'None of this makes Euclidean broken. It never overestimates — a property called admissibility — which is exactly what guarantees the path it hands back is genuinely shortest, and both boards do return the same 43 cells. It is just less informed, and it pays for that with roughly ten times the work.'
    ],
    variantLabels: ['A* · Manhattan', 'A* · Euclidean']
  },
  'hidden-on-axis': {
    title: "Why you'd never notice on a straight line",
    hook: 'The same two heuristics, now indistinguishable. The bug hides on axis-aligned tests.',
    watchFor: 'Nothing differs. Both boards expand exactly the same cells in the same order.',
    body: [
      'This is the last lesson with one change: the start and the goal now share a row. The dramatic difference vanishes, and the two searches turn out identical down to the last cell.',
      'The reason is just arithmetic. Euclidean distance is $\\sqrt{\\Delta x^{2} + \\Delta y^{2}}$. When the offset is purely horizontal, $\\Delta y$ is zero, and that collapses to $\\sqrt{\\Delta x^{2}} = \\lvert \\Delta x \\rvert$ — exactly the Manhattan distance. Same story for a purely vertical offset. The two heuristics agree perfectly whenever the goal sits directly along a row or column, and disagree most on the diagonal, where Euclidean returns $\\sqrt{2}\\,d$ against a true $2d$ — about 71%.',
      'Offset (20, 0): true 20, Manhattan 20, Euclidean 20.00. Offset (16, 4): true 20, Manhattan 20, Euclidean 16.49. Offset (10, 10): true 20, Manhattan 20, Euclidean 14.14. The error grows the further the offset turns away from an axis, and disappears once it lines up with one.',
      'Worth remembering outside of pathfinding, too: a heuristic that is only wrong off-axis will look flawless in any test where the goal sits straight ahead of the start — which is exactly the first test most people happen to write.'
    ],
    variantLabels: ['A* · Manhattan', 'A* · Euclidean']
  },
  'overestimating-breaks-it': {
    title: 'Overestimating trades correctness for speed',
    hook: 'Euclidean squared explores less and comes back with a path twice as long.',
    watchFor:
      'The board on the right finishes with far less exploring — and a path of 63 cells where 31 was possible.',
    body: [
      'If underestimating makes A* explore too much, the obvious fix is to overestimate instead. Squaring the Euclidean distance does that in a big way — where the true remaining distance is 7 it reports 25, and where the truth is 20 it reports 200. On an open board this looks fantastic: A* stops hedging and drives straight at the goal, expanding 43 cells where plain Euclidean expanded 470.',
      'The catch: that shortest-path guarantee came from never overestimating in the first place. An admissible heuristic can promise that once A* reaches the goal, nothing cheaper is still waiting on the frontier. The moment $h$ can overstate the remaining distance, a cell on the actual shortest path can get scored so pessimistically that A* settles for something else and never comes back. The search still finishes, and it still hands back a path — it is just not the shortest one anymore.',
      "This board is built to make that happen. The corridor along the goal's row is roughly twice as long as the open bypass above it, but it hugs the goal the entire way. With $h$ drowning out $g$, A* barely weighs travel cost at all, dives into the corridor, and commits. The result: 63 cells instead of a possible 31.",
      'The uncomfortable part is not that it fails — it is how quietly. On the open board it was faster and still correct. It gives no warning whatsoever until the board has a shape that punishes it, and then it just hands back a worse answer instead of an error.'
    ],
    variantLabels: ['A* · Manhattan', 'A* · Euclidean squared']
  },
  'greedy-takes-the-bait': {
    title: 'Greedy best-first takes the bait',
    hook: 'Ignoring the distance already travelled is a decision, and this board charges for it.',
    watchFor:
      'Greedy dives straight into the corridor because every cell in it looks closer to the goal. A* pays the extra cost up front and goes over the top.',
    body: [
      "Greedy best-first is A* with the $g$ term ripped out. It ranks the frontier purely by what looks closest to the goal, and never cares what reaching a cell has already cost. On open ground that's a fine bet, and it beelines beautifully. This board is built to make it pay for that bet.",
      "The corridor running along the goal's row snakes up and down between teeth, so crossing it costs four vertical moves for every two columns of progress — roughly twice the length of the clear bypass above. But every cell inside the corridor sits closer to the goal than any cell on the bypass, because the bypass first has to climb away from the goal's row. Greedy only sees that part, so in it goes.",
      "Worth being precise about what greedy actually does, since it's not simple hill-climbing — it keeps a real frontier and will happily abandon a dead end to expand somewhere else. What sinks it here is subtler: whichever route reaches the goal first is the one that kept $h$ lowest the whole way, and that's the corridor. The path it hands back is just the parents behind that arrival — 63 cells against a possible 31.",
      'A* dodges this for one reason: as the corridor zigzags, $g$ climbs fast, so $f$ climbs with it — meanwhile the bypass costs a few cells of climbing and then runs flat. Somewhere around the point where the corridor has zigzagged enough, the bypass becomes the cheaper bet, and A* switches over. Counting what you have already spent is exactly what makes the difference.'
    ],
    variantLabels: ['A* · g + h', 'Greedy · h only']
  },
  'dijkstra-ignores-the-goal': {
    title: "Dijkstra has no idea where it's going",
    hook: 'No heuristic at all: a spreading disc instead of a cone. Same path, fourteen times the work.',
    watchFor:
      'A* sweeps a cone towards the goal. Dijkstra grows an even disc outwards from the start, expanding cells in the wrong direction entirely.',
    body: [
      'This is the frontier from the very first lesson, back at full size. Dijkstra ranks its frontier by $g$ alone: always expand the cheapest cell reached so far. It has no concept of where the goal is, so it cannot prefer one direction over another — it grows an even disc outward from the start, exactly like the frontier panel showed earlier, just on a board too big to watch one row at a time.',
      "That's why it expands 615 cells here against A*'s 43, even though both return the identical 43-cell path. Most of Dijkstra's work goes into cells pointing straight away from the goal — cells A* never even glanced at, because their $f$ scores knocked them out of contention immediately.",
      'These two are the same algorithm, really. Dijkstra is just A* with $h = 0$, sitting at the bottom of a ladder: Manhattan is exact and expands only the corridor, Euclidean underestimates and expands a blob, and $h = 0$ knows nothing and expands everything within reach. The formal version of this is called dominance — for two admissible heuristics, if $h_1$ is at least $h_2$ everywhere, then A* with $h_1$ expands a subset of what $h_2$ expands. Manhattan dominates Euclidean, which dominates zero.',
      "None of this makes Dijkstra worse — just differently scoped. It's what you reach for when there is no single goal to aim at, or several at once: after one run it holds the shortest distance to every cell it touched, not just one of them. A* buys its speed by giving that up."
    ],
    variantLabels: ['A* · Manhattan', 'Dijkstra · no heuristic']
  },
  'same-search-three-names': {
    title: 'Three searches that are secretly one search',
    hook: 'Breadth-first and Dijkstra are not merely similar here. They are identical.',
    watchFor: 'The two boards stay in lockstep for all 1,843 steps. Nothing about them differs.',
    body: [
      'Breadth-first search takes cells off the frontier in the order it found them; Dijkstra takes whichever has the smallest cost from the start. Those are genuinely different rules, and on a graph with varying edge costs they would produce genuinely different searches.',
      "On this grid, though, every move costs exactly one. That makes discovery order and increasing distance the exact same ordering — a cell found on the nth wave is exactly n steps from the start, so the queue is already sorted by cost. The two rules can't come apart. They expand the same 615 cells, in the same order, over the same 1,843 steps — the test suite asserts this, it's not just something that happens to look true.",
      "A third algorithm belongs in this same family. A* with $h = 0$ scores every cell by $f = g + 0 = g$, which is exactly Dijkstra's rule, and it produces an identical run too. Try it yourself: pick Custom in the Sandbox and type in 0.",
      'All four searches in this app are really one best-first loop that only differs in the priority it hands a cell — $g + h$, $g$, $h$, or discovery order. Seen that way, they are not four algorithms to memorise, just four points in one small design space — and under uniform costs, three of those points land on top of each other.'
    ],
    variantLabels: ['Dijkstra · lowest g', 'Breadth-first · discovery order']
  },
  'speed-vs-correctness': {
    title: 'The tradeoff, all at once',
    hook: 'Five strategies on one board: how much each explores, and whether the answer was even right.',
    watchFor:
      'The left chart is speed; the right one is correctness. Notice that the two fast, cheap runs are exactly the two that got the wrong answer.',
    body: [
      'Every earlier lesson picked two strategies and lined them up side by side. This one throws all five onto the same board at once, because comparing pairs hides the actual shape of the tradeoff — it\'s not a straight line from "slow and correct" to "fast and wrong."',
      "Look at the two charts together. Dijkstra sits at one extreme: by far the most expanding, and always correct, because it never guesses. Manhattan lands on the same correct answer for a fraction of the work, because on this grid it isn't really guessing either — it's computing the real remaining distance. Between those two, Euclidean spends more than Manhattan to buy nothing at all: same correct answer, several times the work, purely because its guess is weaker.",
      "Now look at the other two. Euclidean squared and greedy best-first are both cheap — competitive with Manhattan on the speed chart — and both wrong, landing on a path twice as long as necessary. Cheap-and-wrong is exactly as available as cheap-and-right, and the speed chart alone cannot tell you which one you are looking at. That is the whole reason these two charts sit side by side instead of collapsing to one number per strategy: a heuristic's cost only means something once you also know whether it is still admissible.",
      'The takeaway: an inadmissible heuristic is not a slower, safer version of a good one, and it is definitely not just "the fast option." It\'s a different kind of bet — usually cheap, occasionally wrong — and the board it gets wrong on rarely looks unusual until after the fact. Manhattan is not on this chart because it is the safe choice; it is here because, on a four-way grid, it happens to be free: the exact remaining distance, at no extra cost over just guessing.'
    ],
    variantLabels: [
      'A* · Manhattan',
      'A* · Euclidean',
      'A* · Euclidean squared',
      'Dijkstra',
      'Greedy best-first'
    ]
  }
};
