// Number-only build: heuristics evaluate plain numeric deltas, so the full
// mathjs bundle (matrices, units, complex numbers) would be dead weight.
import { evaluate } from 'mathjs/number';
import type { Cell } from './cell';

export type HeuristicSpec =
  | { readonly kind: 'manhattan' }
  | { readonly kind: 'euclidean' }
  | { readonly kind: 'custom'; readonly formula: string };

export type HeuristicKind = HeuristicSpec['kind'];

export type HeuristicFn = (from: Cell, to: Cell) => number;

export const DEFAULT_HEURISTIC: HeuristicSpec = { kind: 'euclidean' };

export const DEFAULT_CUSTOM_FORMULA = 'sqrt(x^2 + y^2)';

export const HEURISTIC_LABELS: Record<HeuristicKind, string> = {
  manhattan: 'Manhattan',
  euclidean: 'Euclidean',
  custom: 'Custom'
};

const manhattan: HeuristicFn = (from, to) => Math.abs(from.x - to.x) + Math.abs(from.y - to.y);

const euclidean: HeuristicFn = (from, to) => Math.hypot(from.x - to.x, from.y - to.y);

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
    case 'custom':
      return custom(spec.formula);
  }
}

export function describeHeuristic(spec: HeuristicSpec): string {
  return spec.kind === 'custom' ? `custom formula ${spec.formula}` : `${spec.kind} distance`;
}
