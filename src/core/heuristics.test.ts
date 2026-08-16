import { describe, expect, it } from 'vitest';
import { cell } from './cell';
import { checkFormula, createHeuristic, HEURISTIC_KINDS, HEURISTIC_LABELS } from './heuristics';

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
    for (const kind of HEURISTIC_KINDS) expect(HEURISTIC_LABELS[kind]).toBeTruthy();
  });
});

describe('checking a custom formula', () => {
  it('accepts a valid formula and reports what it scores', () => {
    expect(checkFormula('sqrt(x^2 + y^2)')).toEqual({ ok: true, sample: 5 });
  });

  it('rejects an empty formula', () => {
    expect(checkFormula('   ')).toEqual({ ok: false, error: 'Enter a formula.' });
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
      error: 'This does not work out to a number.'
    });
  });
});
