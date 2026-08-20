import { LESSON_CONTENT_EN, type LessonContent } from '../content/lessons.en';
import type { AlgorithmId } from './algorithms';
import { combTrap, FRONTIER_DEMO, OPEN_DIAGONAL, OPEN_STRAIGHT } from './boards';
import type { SerializedGrid } from './Grid';
import type { HeuristicSpec } from './heuristics';

export type LessonVariant = {
  readonly label: string;
  readonly algorithm: AlgorithmId;
  readonly heuristic: HeuristicSpec;
};

/** Which algorithms run and on which board -- the words describing them live
 *  in content/lessons.en.ts (or a future locale's equivalent) instead, so
 *  that a translation only has to replace one file. */
type LessonStructure = {
  readonly id: string;
  readonly layout: LessonLayout;
  readonly board: SerializedGrid;
  readonly variants: ReadonlyArray<{
    readonly algorithm: AlgorithmId;
    readonly heuristic: HeuristicSpec;
  }>;
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

const LESSON_STRUCTURE: readonly LessonStructure[] = [
  {
    id: 'why-pathfinding',
    layout: 'frontier',
    board: FRONTIER_DEMO,
    variants: [{ algorithm: 'astar', heuristic: MANHATTAN }]
  },
  {
    id: 'meet-the-frontier',
    layout: 'frontier',
    board: FRONTIER_DEMO,
    variants: [{ algorithm: 'dijkstra', heuristic: MANHATTAN }]
  },
  {
    id: 'adding-a-heuristic',
    layout: 'frontier',
    board: FRONTIER_DEMO,
    variants: [{ algorithm: 'astar', heuristic: MANHATTAN }]
  },
  {
    id: 'exact-vs-optimistic',
    layout: 'compare',
    board: OPEN_DIAGONAL,
    variants: [
      { algorithm: 'astar', heuristic: MANHATTAN },
      { algorithm: 'astar', heuristic: { kind: 'euclidean' } }
    ]
  },
  {
    id: 'hidden-on-axis',
    layout: 'compare',
    board: OPEN_STRAIGHT,
    variants: [
      { algorithm: 'astar', heuristic: MANHATTAN },
      { algorithm: 'astar', heuristic: { kind: 'euclidean' } }
    ]
  },
  {
    id: 'overestimating-breaks-it',
    layout: 'compare',
    board: combTrap(),
    variants: [
      { algorithm: 'astar', heuristic: MANHATTAN },
      { algorithm: 'astar', heuristic: { kind: 'euclidean-squared' } }
    ]
  },
  {
    id: 'greedy-takes-the-bait',
    layout: 'compare',
    board: combTrap(),
    variants: [
      { algorithm: 'astar', heuristic: MANHATTAN },
      { algorithm: 'greedy', heuristic: MANHATTAN }
    ]
  },
  {
    id: 'dijkstra-ignores-the-goal',
    layout: 'compare',
    board: OPEN_DIAGONAL,
    variants: [
      { algorithm: 'astar', heuristic: MANHATTAN },
      { algorithm: 'dijkstra', heuristic: MANHATTAN }
    ]
  },
  {
    id: 'same-search-three-names',
    layout: 'compare',
    board: OPEN_DIAGONAL,
    variants: [
      { algorithm: 'dijkstra', heuristic: MANHATTAN },
      { algorithm: 'bfs', heuristic: MANHATTAN }
    ]
  },
  {
    id: 'speed-vs-correctness',
    layout: 'scoreboard',
    board: combTrap(),
    variants: [
      { algorithm: 'astar', heuristic: MANHATTAN },
      { algorithm: 'astar', heuristic: { kind: 'euclidean' } },
      { algorithm: 'astar', heuristic: { kind: 'euclidean-squared' } },
      { algorithm: 'dijkstra', heuristic: MANHATTAN },
      { algorithm: 'greedy', heuristic: MANHATTAN }
    ]
  }
];

/** Structure and content, brought together by id. A future locale swaps in
 *  its own content map and re-runs this same merge. */
function buildLessons(
  structure: readonly LessonStructure[],
  content: Record<string, LessonContent>
): readonly Lesson[] {
  return structure.map((s) => {
    const c = content[s.id];
    return {
      id: s.id,
      layout: s.layout,
      board: s.board,
      title: c.title,
      hook: c.hook,
      watchFor: c.watchFor,
      body: c.body,
      variants: s.variants.map((v, i) => ({ ...v, label: c.variantLabels[i] }))
    };
  });
}

export const LESSONS: readonly Lesson[] = buildLessons(LESSON_STRUCTURE, LESSON_CONTENT_EN);

export const DEFAULT_LESSON_ID = LESSONS[0].id;

export function findLesson(id: string | null | undefined): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}
