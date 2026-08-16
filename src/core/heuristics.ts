// Number-only build: heuristics evaluate plain numeric deltas, so the full
// mathjs bundle (matrices, units, complex numbers) would be dead weight.
import { evaluate } from 'mathjs/number';
import type { Cell } from './cell';

export type HeuristicSpec =
  | { readonly kind: 'manhattan' }
  | { readonly kind: 'euclidean' }
  | { readonly kind: 'euclidean-squared' }
  | { readonly kind: 'custom'; readonly formula: string };

export type HeuristicKind = HeuristicSpec['kind'];

export type HeuristicFn = (from: Cell, to: Cell) => number;

export const DEFAULT_HEURISTIC: HeuristicSpec = { kind: 'manhattan' };

export const DEFAULT_CUSTOM_FORMULA = 'sqrt(x^2 + y^2)';

export const HEURISTIC_KINDS: HeuristicKind[] = [
  'manhattan',
  'euclidean',
  'euclidean-squared',
  'custom'
];

export const HEURISTIC_LABELS: Record<HeuristicKind, string> = {
  manhattan: 'Manhattan',
  euclidean: 'Euclidean',
  'euclidean-squared': 'Euclidean squared',
  custom: 'Custom'
};

/**
 * Why each choice behaves the way it does. Movement here is four-way, so the
 * true remaining distance is always the Manhattan one -- everything else is
 * either an under- or an overestimate of it, and that is what decides how
 * widely the search fans out.
 */
export const HEURISTIC_BLURBS: Record<HeuristicKind, string> = {
  manhattan:
    'Counts steps along the grid. Exactly the real remaining distance here, so A* walks almost straight to the goal.',
  euclidean:
    'Straight-line distance. Since you cannot move diagonally it underestimates every move, so A* hedges and fans out much like Dijkstra. Still finds the shortest path.',
  'euclidean-squared':
    'Straight-line distance squared. A wild overestimate, so A* charges at the goal and explores very little — but it gives up the guarantee of a shortest path.',
  custom: 'Your own formula over the x and y distances to the goal.'
};

const manhattan: HeuristicFn = (from, to) => Math.abs(from.x - to.x) + Math.abs(from.y - to.y);

const euclidean: HeuristicFn = (from, to) => Math.hypot(from.x - to.x, from.y - to.y);

const euclideanSquared: HeuristicFn = (from, to) => (from.x - to.x) ** 2 + (from.y - to.y) ** 2;

const custom =
  (formula: string): HeuristicFn =>
  (from, to) => {
    const result = evaluate(formula, { x: from.x - to.x, y: from.y - to.y });
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error(`Formula "${formula}" did not evaluate to a finite number`);
    }
    return result;
  };

export function createHeuristic(spec: HeuristicSpec): HeuristicFn {
  switch (spec.kind) {
    case 'manhattan':
      return manhattan;
    case 'euclidean':
      return euclidean;
    case 'euclidean-squared':
      return euclideanSquared;
    case 'custom':
      return custom(spec.formula);
  }
}

/** A worked example so the formula editor can show what a formula does. */
export const SAMPLE_DELTA = { x: 3, y: 4 } as const;

export type FormulaCheck =
  { readonly ok: true; readonly sample: number } | { readonly ok: false; readonly error: string };

/** Validates a custom formula against a sample offset, without throwing. */
export function checkFormula(formula: string): FormulaCheck {
  if (formula.trim() === '') return { ok: false, error: 'Enter a formula.' };
  try {
    const value = evaluate(formula, { ...SAMPLE_DELTA });
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, error: 'This does not work out to a number.' };
    }
    return { ok: true, sample: value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Invalid formula.' };
  }
}

export const FORMULA_EXAMPLES: { readonly formula: string; readonly label: string }[] = [
  { formula: 'abs(x) + abs(y)', label: 'Manhattan' },
  { formula: 'sqrt(x^2 + y^2)', label: 'Euclidean' },
  { formula: 'max(abs(x), abs(y))', label: 'Chebyshev' },
  { formula: '0', label: 'Zero — turns A* into Dijkstra' }
];
