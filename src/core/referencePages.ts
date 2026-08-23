import { REFERENCE_CONTENT_EN, type ReferenceSection } from '../content/reference.en';
import type { AlgorithmId } from './algorithms';
import { combTrap, FRONTIER_DEMO, OPEN_DIAGONAL, OPEN_DIAGONAL_45, OPEN_STRAIGHT } from './boards';
import type { SerializedGrid } from './Grid';
import type { HeuristicSpec } from './heuristics';
import type { LessonLayout, LessonVariant } from './lessons';

/** Which algorithms run and on which board for one demo -- the words around
 *  it (caption, variant labels) live in content/reference.en.ts instead. */
type DemoStructure = {
  readonly board: SerializedGrid;
  readonly layout: LessonLayout;
  readonly variants: ReadonlyArray<{
    readonly algorithm: AlgorithmId;
    readonly heuristic: HeuristicSpec;
  }>;
};

type PageStructure = {
  readonly id: string;
  readonly demos: readonly DemoStructure[];
};

export type ReferenceDemo = {
  readonly board: SerializedGrid;
  readonly layout: LessonLayout;
  readonly variants: readonly LessonVariant[];
  readonly caption: string;
};

export type ReferencePage = {
  readonly id: string;
  readonly title: string;
  readonly hook: string;
  readonly sections: readonly ReferenceSection[];
  readonly demos: readonly ReferenceDemo[];
};

const MANHATTAN: HeuristicSpec = { kind: 'manhattan' };
const EUCLIDEAN: HeuristicSpec = { kind: 'euclidean' };

const PAGE_STRUCTURE: readonly PageStructure[] = [
  {
    id: 'astar',
    demos: [
      {
        board: FRONTIER_DEMO,
        layout: 'frontier',
        variants: [{ algorithm: 'astar', heuristic: MANHATTAN }]
      },
      {
        board: OPEN_DIAGONAL,
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'dijkstra', heuristic: MANHATTAN }
        ]
      }
    ]
  },
  {
    id: 'manhattan',
    demos: [
      {
        board: OPEN_DIAGONAL_45,
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'astar', heuristic: EUCLIDEAN }
        ]
      },
      {
        board: combTrap(),
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'greedy', heuristic: MANHATTAN }
        ]
      }
    ]
  },
  {
    id: 'euclidean',
    demos: [
      {
        board: OPEN_STRAIGHT,
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'astar', heuristic: EUCLIDEAN }
        ]
      },
      {
        board: OPEN_DIAGONAL,
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'astar', heuristic: EUCLIDEAN }
        ]
      },
      {
        board: OPEN_DIAGONAL_45,
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'astar', heuristic: EUCLIDEAN }
        ]
      }
    ]
  },
  {
    id: 'dijkstra',
    demos: [
      {
        board: FRONTIER_DEMO,
        layout: 'frontier',
        variants: [{ algorithm: 'dijkstra', heuristic: MANHATTAN }]
      },
      {
        board: OPEN_DIAGONAL,
        layout: 'compare',
        variants: [
          { algorithm: 'astar', heuristic: MANHATTAN },
          { algorithm: 'dijkstra', heuristic: MANHATTAN }
        ]
      }
    ]
  }
];

/** Structure and content, brought together by id -- same pattern as
 *  core/lessons.ts's buildLessons. */
function buildReferencePages(
  structure: readonly PageStructure[],
  content: typeof REFERENCE_CONTENT_EN
): readonly ReferencePage[] {
  return structure.map((s) => {
    const c = content[s.id];
    return {
      id: s.id,
      title: c.title,
      hook: c.hook,
      sections: c.sections,
      demos: s.demos.map((d, i) => ({
        board: d.board,
        layout: d.layout,
        caption: c.demos[i].caption,
        variants: d.variants.map((v, j) => ({ ...v, label: c.demos[i].variantLabels[j] }))
      }))
    };
  });
}

export const REFERENCE_PAGES: readonly ReferencePage[] = buildReferencePages(
  PAGE_STRUCTURE,
  REFERENCE_CONTENT_EN
);

export const DEFAULT_REFERENCE_ID = REFERENCE_PAGES[0].id;

export function findReferencePage(id: string | null | undefined): ReferencePage {
  return REFERENCE_PAGES.find((p) => p.id === id) ?? REFERENCE_PAGES[0];
}
