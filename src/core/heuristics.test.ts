import { describe, expect, it } from 'vitest';
import { cell } from './cell';
import {
  checkFormula,
  createHeuristic,
  formulaTex,
  HEURISTIC_KINDS,
  HEURISTIC_LABEL_KEYS,
  heuristicPull,
  heuristicTex
} from './heuristics';

const from = cell(0, 0);
const to = cell(3, 4);

describe('built-in heuristics', () => {
  it('measures four-way steps for manhattan', () => {
    expect(createHeuristic({ kind: 'manhattan' })(from, to)).toBe(7);
  });

  it('measures straight-line distance for euclidean', () => {
    expect(createHeuristic({ kind: 'euclidean' })(from, to)).toBe(5);
  });

  // The distinction that matters: on a four-way grid the real remaining
  // distance is 7, so euclidean underestimates and euclidean-squared wildly
  // overestimates. That is what makes one fan out and the other charge ahead.
  it('overestimates for euclidean squared', () => {
    expect(createHeuristic({ kind: 'euclidean-squared' })(from, to)).toBe(25);
  });

  it('labels every kind it offers', () => {
    for (const kind of HEURISTIC_KINDS) expect(HEURISTIC_LABEL_KEYS[kind]).toBeTruthy();
  });
});

describe('checking a custom formula', () => {
  it('accepts a valid formula and reports what it scores', () => {
    expect(checkFormula('sqrt(x^2 + y^2)')).toEqual({ ok: true, sample: 5 });
  });

  it('rejects an empty formula', () => {
    expect(checkFormula('   ')).toEqual({ ok: false, errorKey: 'empty' });
  });

  it('rejects a formula that does not parse', () => {
    expect(checkFormula('sqrt(x^2 +').ok).toBe(false);
  });

  it('rejects an unknown variable', () => {
    expect(checkFormula('x + z').ok).toBe(false);
  });

  it('rejects a formula that is not a number', () => {
    expect(checkFormula('"nope"')).toEqual({
      ok: false,
      errorKey: 'notANumber'
    });
  });
});

describe('LaTeX explanations', () => {
  it('writes the manhattan rule and its arithmetic', () => {
    const tex = heuristicTex({ kind: 'manhattan' }, -3, 4, 7);

    expect(tex.definition).toBe('h = \\lvert \\Delta x \\rvert + \\lvert \\Delta y \\rvert');
    expect(tex.substituted).toBe('h = \\lvert -3 \\rvert + \\lvert 4 \\rvert = 7');
  });

  it('parenthesises negatives so exponents stay correct', () => {
    const tex = heuristicTex({ kind: 'euclidean-squared' }, -3, 4, 25);

    expect(tex.substituted).toContain('\\left(-3\\right)^{2}');
    expect(tex.substituted).toContain('4^{2}');
  });

  it('renders a custom formula and substitutes into it', () => {
    const tex = heuristicTex({ kind: 'custom', formula: 'sqrt(x^2 + y^2)' }, -3, 4, 5);

    expect(tex.definition).toContain('\\sqrt');
    expect(tex.substituted).toContain('-3');
    expect(tex.substituted).toMatch(/= 5$/);
  });

  it('falls back to plain text when a formula does not parse', () => {
    expect(formulaTex('sqrt(x^2 +')).toBe('\\text{sqrt(x^2 +}');
  });
});

describe('heuristic pull', () => {
  const goal = cell(10, 10);

  it('points at the goal', () => {
    // Goal is down and to the right, so the angle is in the first quadrant of
    // screen space, where y grows downwards.
    expect(heuristicPull({ kind: 'manhattan' }, cell(0, 0), goal).angleDeg).toBeCloseTo(45);
    expect(heuristicPull({ kind: 'manhattan' }, cell(0, 10), goal).angleDeg).toBe(0);
  });

  // The number that decides whether a search drives or hedges: every move
  // costs 1, so a drop of exactly 1 keeps f flat.
  it('is exactly 1 for manhattan, which is why A* barely wanders', () => {
    expect(heuristicPull({ kind: 'manhattan' }, cell(3, 7), goal).ratio).toBe(1);
  });

  it('is under 1 for euclidean off-axis, which is why A* fans out', () => {
    const diagonal = heuristicPull({ kind: 'euclidean' }, cell(0, 0), goal).ratio;

    // One step of a diagonal approach only shortens the straight line from
    // hypot(10, 10) to hypot(9, 10) -- about 0.69 of the 1 the step costs.
    expect(diagonal).toBeCloseTo(Math.hypot(10, 10) - Math.hypot(9, 10), 6);
    expect(diagonal).toBeLessThan(1);
  });

  it('matches manhattan when euclidean is axis-aligned', () => {
    expect(heuristicPull({ kind: 'euclidean' }, cell(0, 10), goal).ratio).toBeCloseTo(1);
  });

  it('overshoots 1 for an overestimating heuristic', () => {
    expect(heuristicPull({ kind: 'euclidean-squared' }, cell(0, 10), goal).ratio).toBeGreaterThan(
      1
    );
  });

  it('reports the change in h for each direction', () => {
    const pull = heuristicPull({ kind: 'manhattan' }, cell(5, 10), goal);
    const byName = Object.fromEntries(pull.directions.map((d) => [d.name, d.deltaH]));

    expect(byName.right).toBe(-1); // towards the goal
    expect(byName.left).toBe(1); // away from it
    expect(byName.up).toBe(1);
    expect(byName.down).toBe(1);
  });
});
