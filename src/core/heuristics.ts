// Number-only build: heuristics evaluate plain numeric deltas, so the full
// mathjs bundle (matrices, units, complex numbers) would be dead weight.
import { ConstantNode, evaluate, parse } from 'mathjs/number';
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

/** Message keys, not English -- see src/i18n/locales/en.json under
 *  "heuristic". core/ has no i18n available to it (it runs in the worker),
 *  so the UI layer resolves these against the active locale. */
export const HEURISTIC_LABEL_KEYS: Record<HeuristicKind, string> = {
  manhattan: 'heuristic.manhattan.label',
  euclidean: 'heuristic.euclidean.label',
  'euclidean-squared': 'heuristic.euclideanSquared.label',
  custom: 'heuristic.custom.label'
};

/**
 * Why each choice behaves the way it does. Movement here is four-way, so the
 * true remaining distance is always the Manhattan one -- everything else is
 * either an under- or an overestimate of it, and that is what decides how
 * widely the search fans out.
 */
export const HEURISTIC_BLURB_KEYS: Record<HeuristicKind, string> = {
  manhattan: 'heuristic.manhattan.blurb',
  euclidean: 'heuristic.euclidean.blurb',
  'euclidean-squared': 'heuristic.euclideanSquared.blurb',
  custom: 'heuristic.custom.blurb'
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

/** Message keys under "sandbox.formula.error" in en.json. `detail`, when
 *  present, is the underlying parser's own message -- already just English
 *  from a third-party library, so it is shown as-is rather than translated. */
export type FormulaErrorKey = 'empty' | 'notANumber' | 'invalid';

export type FormulaCheck =
  | { readonly ok: true; readonly sample: number }
  | { readonly ok: false; readonly errorKey: FormulaErrorKey; readonly detail?: string };

/** Validates a custom formula against a sample offset, without throwing. */
export function checkFormula(formula: string): FormulaCheck {
  if (formula.trim() === '') return { ok: false, errorKey: 'empty' };
  try {
    const value = evaluate(formula, { ...SAMPLE_DELTA });
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, errorKey: 'notANumber' };
    }
    return { ok: true, sample: value };
  } catch (error) {
    return {
      ok: false,
      errorKey: 'invalid',
      detail: error instanceof Error ? error.message : undefined
    };
  }
}

/** Labels are message keys under "sandbox.formula.example" in en.json. */
export const FORMULA_EXAMPLES: { readonly formula: string; readonly labelKey: string }[] = [
  { formula: 'abs(x) + abs(y)', labelKey: 'sandbox.formula.example.manhattan' },
  { formula: 'sqrt(x^2 + y^2)', labelKey: 'sandbox.formula.example.euclidean' },
  { formula: 'max(abs(x), abs(y))', labelKey: 'sandbox.formula.example.chebyshev' },
  { formula: '0', labelKey: 'sandbox.formula.example.zero' }
];

/**
 * A heuristic written out twice: once as its definition, once with this cell's
 * numbers already substituted in. Rendered as LaTeX in the cell inspector, so
 * the reader can see the rule and the arithmetic side by side.
 */
export type TexExplanation = {
  readonly definition: string;
  readonly substituted: string;
};

const num = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(2));

/** Wraps negatives in parentheses so exponents read correctly. */
const term = (n: number): string => (n < 0 ? `\\left(${num(n)}\\right)` : num(n));

/**
 * dx and dy are signed offsets from the cell to the goal -- the same values a
 * custom formula sees as x and y.
 */
export function heuristicTex(
  spec: HeuristicSpec,
  dx: number,
  dy: number,
  value: number
): TexExplanation {
  switch (spec.kind) {
    case 'manhattan':
      return {
        definition: 'h = \\lvert \\Delta x \\rvert + \\lvert \\Delta y \\rvert',
        substituted: `h = \\lvert ${num(dx)} \\rvert + \\lvert ${num(dy)} \\rvert = ${num(value)}`
      };
    case 'euclidean':
      return {
        definition: 'h = \\sqrt{\\Delta x^{2} + \\Delta y^{2}}',
        substituted: `h = \\sqrt{${term(dx)}^{2} + ${term(dy)}^{2}} = ${num(value)}`
      };
    case 'euclidean-squared':
      return {
        definition: 'h = \\Delta x^{2} + \\Delta y^{2}',
        substituted: `h = ${term(dx)}^{2} + ${term(dy)}^{2} = ${num(value)}`
      };
    case 'custom':
      return {
        definition: `h = ${formulaTex(spec.formula)}`,
        substituted: `h = ${formulaTex(spec.formula, { x: dx, y: dy })} = ${num(value)}`
      };
  }
}

/**
 * Renders a mathjs expression as LaTeX, optionally with its variables already
 * replaced by numbers. Falls back to the raw text when the formula does not
 * parse, which the editor already reports separately.
 */
export function formulaTex(formula: string, scope?: { x: number; y: number }): string {
  try {
    const parsed = parse(formula);
    if (!scope) return parsed.toTex();
    return parsed
      .transform((node) => {
        // MathNode does not surface the symbol fields, so narrow on the tag.
        const symbol = node as { type?: string; name?: string };
        if (symbol.type !== 'SymbolNode') return node;
        if (symbol.name !== 'x' && symbol.name !== 'y') return node;
        return new ConstantNode(symbol.name === 'x' ? scope.x : scope.y);
      })
      .toTex();
  } catch {
    return `\\text{${formula.replace(/[{}\\]/g, '')}}`;
  }
}

export type PullDirection = {
  readonly name: 'up' | 'down' | 'left' | 'right';
  /** How h changes taking this step: negative means it moves closer. */
  readonly deltaH: number;
};

/**
 * How hard the heuristic leans on a cell.
 *
 * Not the value of h -- that is just distance, and it is largest where the
 * search has barely started. What steers the search is the *gradient*: how much
 * h falls for one step, measured against the 1 that the step costs.
 *
 * `ratio` is that comparison, and it is the whole story about fanning out. At 1
 * a step toward the goal pays for itself exactly and f stays flat, so A* drives
 * straight at the goal. Below 1 the step costs more than it appears to buy, f
 * creeps up, and rival directions stay competitive -- the search spreads. Above
 * 1 the heuristic overpays, which is fast and is also how the shortest-path
 * guarantee is lost.
 */
export type HeuristicPull = {
  /** Direction of the goal in screen terms: 0 is right, 90 is down. */
  readonly angleDeg: number;
  /** The largest drop in h available from a single step. */
  readonly best: number;
  readonly ratio: number;
  readonly directions: readonly PullDirection[];
};

export function heuristicPull(spec: HeuristicSpec, from: Cell, goal: Cell): HeuristicPull {
  const h = createHeuristic(spec);
  const here = h(from, goal);

  const directions: PullDirection[] = (
    [
      ['up', 0, -1],
      ['down', 0, 1],
      ['left', -1, 0],
      ['right', 1, 0]
    ] as const
  ).map(([name, ox, oy]) => ({
    name,
    deltaH: h({ x: from.x + ox, y: from.y + oy }, goal) - here
  }));

  const best = Math.max(0, ...directions.map((d) => -d.deltaH));

  return {
    angleDeg: (Math.atan2(goal.y - from.y, goal.x - from.x) * 180) / Math.PI,
    best,
    // Every move on this grid costs exactly 1, so the drop is already the ratio.
    ratio: best,
    directions
  };
}
