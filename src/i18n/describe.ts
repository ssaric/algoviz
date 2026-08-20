import type { BoardMessage } from '../board/Painter';
import type { FormulaCheck } from '../core/heuristics';
import type { StepNote } from '../core/protocol';

/** Matches svelte-i18n's `$_` shape without importing svelte-i18n itself --
 *  this module is plain data-in-string-out and stays usable from a test with
 *  a fake translator, not just from a component. Value types mirror what
 *  svelte-i18n's own formatter accepts. */
export type Translate = (
  key: string,
  options?: { values?: Record<string, string | number | boolean | Date | null | undefined> }
) => string;

/** Turns a step's translation-ready note into the sentence the popup and the
 *  board narration both show. One place for this so the two never drift. */
export function describeStepNote(note: StepNote, t: Translate): string {
  switch (note.key) {
    case 'step.visit':
      return t('step.visit', { values: { affinity: t(note.affinityKey), score: note.score } });
    case 'step.discover':
      return t('step.discover', { values: { g: note.g, score: note.score } });
    case 'step.skip':
      return t('step.skip', { values: { existing: note.existing, cost: note.cost } });
    case 'step.reopen':
      return t('step.reopen', { values: { from: note.from, to: note.to } });
    case 'step.path':
      return t('step.path', {
        values: { index: note.index, total: note.total, algorithmName: t(note.algorithmNameKey) }
      });
  }
}

/** `board.error`'s `detail` is an unexpected error's own message -- already
 *  just English, and diagnostic rather than content, so it's appended as-is
 *  after the translated headline rather than translated itself. */
export function describeBoardMessage(message: BoardMessage, t: Translate): string {
  if (message.key === 'board.error') {
    return t('board.error', { values: { detail: message.detail } });
  }
  return t(message.key);
}

/** The underlying parser's own error text (`detail`) is already just English
 *  from a third-party library and isn't translated -- it's appended as
 *  supplementary detail after the translated headline. */
export function describeFormulaError(
  check: Extract<FormulaCheck, { ok: false }>,
  t: Translate
): string {
  const headline = t(`sandbox.formula.error.${check.errorKey}`);
  return check.detail ? `${headline} (${check.detail})` : headline;
}
