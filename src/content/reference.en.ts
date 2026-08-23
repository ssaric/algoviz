/**
 * Words for the Reference pages, kept apart from the structural data in
 * core/reference.ts (which boards, which algorithms) the same way lesson
 * content is. See lessons.en.ts's header comment for why.
 */

/** A page reads as an ordered sequence of prose blocks, board demos, and the
 *  occasional static diagram, rather than lesson's fixed "lede, one figure,
 *  rest of body" shape -- these pages interleave several demos and figures
 *  with explanation between them. `diagram` ids are mapped to a component in
 *  the reference page itself, the same way `demoIndex` maps into `demos`. */
export type ReferenceSection =
  | { readonly kind: 'prose'; readonly body: readonly string[] }
  | { readonly kind: 'demo'; readonly demoIndex: number }
  | { readonly kind: 'diagram'; readonly id: string };

export type ReferenceDemoContent = {
  /** Shown under the figure -- may contain inline `$...$` maths. */
  readonly caption: string;
  /** Parallel to the demo's `variants`, in the same order. */
  readonly variantLabels: readonly string[];
};

export type ReferenceContent = {
  readonly title: string;
  readonly hook: string;
  readonly sections: readonly ReferenceSection[];
  /** Parallel to the page's structural `demos`, in the same order. */
  readonly demos: readonly ReferenceDemoContent[];
};

export const REFERENCE_CONTENT_EN: Record<string, ReferenceContent> = {
  astar: {
    title: "A*: balancing what you've spent against what's left",
    hook: 'The loop behind every board in this app: one frontier, one score, one rule.',
    sections: [
      {
        kind: 'prose',
        body: [
          'A* is a best-first search. At every step it looks at everything it currently knows about (the frontier) and expands whichever cell looks most promising, judged by one number: $f = g + h$.',
          '$g$ is real: the cost of the cheapest route from the start to this cell, counted from steps actually walked. $h$ is a guess: roughly how far is left to the goal, from a heuristic that never actually walks anywhere. Add them and you get $f$, a guess at the total cost of a route through this cell.',
          'The loop itself never changes: pop the lowest-$f$ cell off the frontier, mark it done, look at its neighbours, repeat. Everything the next three pages cover (which heuristic to use, what happens with none at all) is really just a different answer to one question: what does $h$ look like?'
        ]
      },
      { kind: 'demo', demoIndex: 0 },
      {
        kind: 'prose',
        body: [
          'A* is trustworthy because of one property its heuristic has to hold, called admissibility: $h$ must never overestimate the true remaining distance. As long as that holds, A* is guaranteed to find a genuinely shortest path, because a cell with a falsely optimistic score can never cut ahead of the real answer.',
          "What admissibility doesn't guarantee is speed. A* only stops once every remaining cell's $f$ is at least the cost of the best path found, $C^*$. The closer a heuristic's guesses sit to the truth without ever exceeding it, the fewer cells get dragged below that threshold, and the less work A* has to do to convince itself it's found the best route."
        ]
      },
      { kind: 'demo', demoIndex: 1 },
      {
        kind: 'prose',
        body: [
          'That\'s the entire pitch for A*: it\'s Dijkstra with one extra number added to the score, and that one number is worth an order of magnitude less work, provided the heuristic behind it is trustworthy. The next three pages look at three different answers to "what should $h$ actually be": counting grid steps, measuring straight lines, and not asking the question at all.'
        ]
      }
    ],
    demos: [
      {
        caption:
          'Every number here is real: g, h and f, live, for every cell still waiting. Hover a row, or a cell on the board, to see exactly how its f got computed.',
        variantLabels: ['A* · Manhattan']
      },
      {
        caption:
          'Same board, same start and goal, same shortest path: 43 cells either way. The heuristic on the left turns the search into a cone aimed at the goal. Drop it, and you get the disc on the right, expanding 615 cells to learn what the cone already knew.',
        variantLabels: ['A* · Manhattan', 'Dijkstra · no heuristic']
      }
    ]
  },
  manhattan: {
    title: 'Manhattan: the heuristic that happens to be free',
    hook: "Counts steps along the grid, and on a four-way board, that's not a guess.",
    sections: [
      {
        kind: 'prose',
        body: [
          "Manhattan distance is $h = |\\Delta x| + |\\Delta y|$: the number of rows plus the number of columns between here and the goal, ignoring diagonals entirely. On a board where every move is exactly one step up, down, left or right, that sum isn't an estimate of the remaining distance. It is the remaining distance, exactly, for as long as nothing is in the way.",
          'That single fact is what makes Manhattan special among the heuristics on these pages: it\'s the rare case where "as informed as possible" and "free to compute" are the same thing.'
        ]
      },
      { kind: 'demo', demoIndex: 0 },
      {
        kind: 'prose',
        body: [
          "Zero wasted work isn't a coincidence of this particular board. Whenever the true remaining distance equals the heuristic's estimate, every cell off the eventual path scores strictly worse than $C^*$, so A* never has a reason to look at it. Manhattan achieves that on any four-directional grid with nothing between here and the goal.",
          "Walls don't break the guarantee either. They can only make the *true* remaining distance longer than $|\\Delta x| + |\\Delta y|$, never shorter, so Manhattan can only ever underestimate around an obstacle, never overestimate. It stays admissible; it just stops being exact, and starts behaving more like Euclidean does everywhere. The next page goes into exactly what that costs."
        ]
      },
      { kind: 'demo', demoIndex: 1 },
      {
        kind: 'prose',
        body: [
          'Manhattan is a good reminder that "heuristic" doesn\'t have to mean "guess." On the right kind of board it\'s the honest answer, and A* with an honest answer is about as good as pathfinding gets: no wasted exploration, no risk of getting it wrong.'
        ]
      }
    ],
    demos: [
      {
        caption:
          'The true remaining distance here is 43 steps. A* with Manhattan expands exactly 43 cells, not one more than the path itself. Euclidean, guessing at the same board, needs 519.',
        variantLabels: ['A* · Manhattan', 'A* · Euclidean']
      },
      {
        caption:
          'Both algorithms use the exact same heuristic. The only difference is that A* also counts g, what a route has already cost. That alone is why it takes the longer-looking bypass instead of the corridor greedy falls for.',
        variantLabels: ['A* · g + h', 'Greedy · h only']
      }
    ]
  },
  euclidean: {
    title: 'Euclidean: the straight line that pulls toward the bigger gap',
    hook: 'The most intuitive distance measure, and the reason A* fans out instead of beelining.',
    sections: [
      {
        kind: 'prose',
        body: [
          "Euclidean distance is the one most people reach for first: $h = \\sqrt{\\Delta x^{2} + \\Delta y^{2}}$, the length of the straight line between here and the goal, exactly as a ruler would measure it. It sounds like it should be a great heuristic, since it's literally the shortest possible distance between two points.",
          "The catch is the word straight. Nothing on this grid can move diagonally. Every actual route has to zigzag along rows and columns, so the true walking distance is always at least Euclidean's straight-line guess, usually more. Euclidean is admissible, meaning it never overestimates, but it's a weaker guess than Manhattan almost everywhere, and exactly how much weaker depends entirely on the angle between here and the goal."
        ]
      },
      { kind: 'demo', demoIndex: 0 },
      {
        kind: 'prose',
        body: [
          "When the offset has no vertical component, $\\sqrt{\\Delta x^{2} + 0^{2}} = |\\Delta x|$, so Euclidean's formula collapses to exactly Manhattan's. The same happens for a purely vertical offset. A straight line and a staircase are the same length precisely when there's no staircase to begin with: nothing to zigzag around means nothing for Euclidean to underestimate."
        ]
      },
      { kind: 'demo', demoIndex: 1 },
      {
        kind: 'prose',
        body: [
          "Here's precisely why that blob appears. Picture standing 8 cells short on x and 2 short on y, close to this board's ratio. That's a right triangle: an 8-cell leg, a 2-cell leg, and a hypotenuse running between them. Manhattan only ever adds the two legs (8 + 2 = 10), and moving one step closer on either axis drops that sum by exactly 1. It treats the 8-cell gap and the 2-cell gap as equally worth closing, because it never sees them as a triangle at all, just two independent counters."
        ]
      },
      { kind: 'diagram', id: 'euclideanGradient' },
      {
        kind: 'prose',
        body: [
          'Euclidean measures the hypotenuse instead: $\\sqrt{8^2+2^2} \\approx 8.25$. Shortening the long leg pulls the hypotenuse in hard. Move one step to close the 8-cell gap and h drops to about 7.28, a fall of 0.97, almost a full point. Shortening the short leg barely moves it. Close the 2-cell gap instead and h only drops to about 8.06, a fall of 0.18. Euclidean is telling the search "the big gap is what matters, the small one is basically free to ignore," and it keeps saying that all the way until the small gap is the only one left.',
          'That lopsided pull is what a blob actually is: a wide swath of cells where closing the dominant gap looks almost as good as being on the true shortest path, so none of them score badly enough for A* to rule them out early. Manhattan never plays favourites between axes, so it never creates that swath in the first place.'
        ]
      },
      { kind: 'demo', demoIndex: 2 },
      {
        kind: 'prose',
        body: [
          "There's a hard mathematical floor to how bad this gets. For any offset, $\\dfrac{\\sqrt{\\Delta x^{2}+\\Delta y^{2}}}{|\\Delta x|+|\\Delta y|}$ ranges from exactly 1 (no underestimate at all, on an axis-aligned offset) down to $\\dfrac{1}{\\sqrt{2}} \\approx 0.71$, and it bottoms out precisely when $|\\Delta x| = |\\Delta y|$: a true diagonal. At that exact point the axis favouritism from the demo above disappears, since both directions pull equally, but only because both are now underrewarded by the same amount, which is worse, not better. Nothing about the frontier looks better or worse than its neighbours until A* has expanded most of them.",
          "None of this breaks the shortest-path guarantee. Every board above returns the identical route Manhattan does. Euclidean is simply a heuristic that's never wrong about direction, just consistently too modest about distance, and the less axis-aligned the goal is, the more that modesty costs.",
          "You might wonder whether the roles could ever flip: some board where the straight-line guess pulls ahead of the grid-counting one. On this grid, they can't. For any offset at all, $|\\Delta x| + |\\Delta y| \\ge \\sqrt{\\Delta x^{2}+\\Delta y^{2}}$, so Manhattan's guess is always at least as large as Euclidean's, everywhere, on every board, walls or no walls, because neither formula looks at what's actually between here and the goal. Manhattan expanding more cells than Euclidean would need Euclidean's h to exceed Manhattan's somewhere, and it simply never does. That's the dominance argument from the A* page, and it holds for this pair unconditionally.",
          'That also rules out a speed-for-correctness trade the way an overestimating heuristic can offer. Both Manhattan and Euclidean are admissible, meaning neither ever overestimates, so both always return the true shortest path. Being weaker only ever costs Euclidean speed, never correctness. A heuristic has to be allowed to overestimate before being fast can also mean being wrong.'
        ]
      },
      {
        kind: 'prose',
        body: [
          'That last point is exactly where Euclidean *squared* comes from, and exactly why it behaves so differently despite looking like a small variation. In the code, squared is nothing more than skipping the square root: $h = \\Delta x^{2} + \\Delta y^{2}$ instead of $h = \\sqrt{\\Delta x^{2} + \\Delta y^{2}}$, the same quantity, before the last step.',
          "That one missing operation flips admissibility, because of a fact about numbers rather than about pathfinding: squaring only ever shrinks a value strictly between 0 and 1. Anything 1 or larger only grows when squared, and it grows quadratically, so a straight-line distance of 5 becomes 25, and a distance of 14 becomes roughly 200. Since plain Euclidean is already an honest, admissible underestimate, squaring an underestimate that's 1 or more turns it into an overestimate, and the further away the goal, the wilder that overestimate gets.",
          'Concretely, at an offset of $(3, 4)$, the true remaining distance on this grid is 7. Euclidean reports 5, still an underestimate and still safe, and Euclidean squared reports 25, eighteen over the truth. At $(10, 10)$ the true distance is 20, Euclidean reports about 14.14, and squared reports 200. Plain Euclidean stays a modest, bounded underestimate no matter how far the goal is; squared becomes a bigger lie the farther away it gets.',
          "That's why the two sit on opposite sides of the admissible/inadmissible line despite one being defined as the other's square. Euclidean keeps the obligation every admissible heuristic has: stay honest enough that A* has to fairly check every cell that could still be optimal, and only ever pay for that with speed. Squared drops the obligation entirely, which is what lets it stop checking early. It's fast because it stops verifying, and occasionally wrong for the same reason."
        ]
      }
    ],
    demos: [
      {
        caption:
          'Start and goal share a row here, so the offset is purely horizontal. Watch closely: the two boards are identical, cell for cell.',
        variantLabels: ['A* · Manhattan', 'A* · Euclidean']
      },
      {
        caption:
          'This offset is 28 across and 14 down, mostly horizontal and not a clean diagonal. Manhattan still walks straight to the goal, expanding 43 cells. Euclidean expands the blob on the right: 470 cells, for the same 43-cell path.',
        variantLabels: ['A* · Manhattan', 'A* · Euclidean']
      },
      {
        caption:
          "The offset here is exactly 21 across and 21 down, a true diagonal matched to the same 43-cell path length as the board above so the comparison isolates the angle alone. Manhattan still expands exactly 43 cells. Euclidean now needs 519, worse than the lopsided board's 470, on the identical path length.",
        variantLabels: ['A* · Manhattan', 'A* · Euclidean']
      }
    ]
  },
  dijkstra: {
    title: "Dijkstra: correct everywhere, because it isn't looking anywhere in particular",
    hook: 'No heuristic at all: h = 0, always. Watch the frontier grow into a disc instead of a cone.',
    sections: [
      {
        kind: 'prose',
        body: [
          "Dijkstra's algorithm is A* with the heuristic term deleted: $f = g$, full stop. It ranks the frontier purely by how far it's already walked, with no opinion at all about where the goal is, because as far as its scoring is concerned, there is no goal until it happens to expand the cell the goal sits on."
        ]
      },
      { kind: 'demo', demoIndex: 0 },
      {
        kind: 'prose',
        body: [
          "That's why the frontier grows the way it does: a ring, expanding outward from the start at the same rate in every direction, one step further out for every step Dijkstra has already taken. It isn't being cautious or thorough on purpose. It simply has no information that would let it prefer one direction over another."
        ]
      },
      { kind: 'demo', demoIndex: 1 },
      {
        kind: 'prose',
        body: [
          "None of this makes Dijkstra worse at its job. It's solving a slightly different problem than A* is. Because it never assumes there's one goal to aim at, a single Dijkstra run hands you the shortest distance from the start to every cell it reaches, not just one of them. That's exactly what you want for multiple destinations, or no fixed destination at all; A* would have to be re-run from scratch for each one. The cone is the reward for aiming at a single target in advance, and the disc is the price of not having one."
        ]
      }
    ],
    demos: [
      {
        caption:
          "Watch the ranking on the right: it's sorted purely by g. Nothing about it leans toward the goal. It can't, since h is 0 for every cell here.",
        variantLabels: ['Dijkstra · no heuristic']
      },
      {
        caption:
          'Both boards return the identical 43-cell shortest path. A* gets there by expanding a cone of 43 cells aimed at the goal. Dijkstra expands a disc of 615, most of it in directions that never had a chance of being useful.',
        variantLabels: ['A* · Manhattan', 'Dijkstra · no heuristic']
      }
    ]
  }
};
