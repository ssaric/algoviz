import type { StepKind } from '../core/protocol';

/** Shared between the cell inspector and the board's live narration, so the
 *  same event is always named and coloured the same way wherever it shows up.
 *  `labelKey` resolves against the active locale; see en.json under
 *  "stepKind". */
export const STEP_KINDS: Record<StepKind, { labelKey: string; tone: string }> = {
  visit: { labelKey: 'stepKind.visit', tone: 'bg-brand text-white' },
  discover: { labelKey: 'stepKind.discover', tone: 'bg-frontier text-brand' },
  reopen: { labelKey: 'stepKind.reopen', tone: 'bg-sunken text-ink-muted' },
  skip: { labelKey: 'stepKind.skip', tone: 'bg-sunken text-ink-muted' },
  path: { labelKey: 'stepKind.path', tone: 'bg-path text-white' }
};
