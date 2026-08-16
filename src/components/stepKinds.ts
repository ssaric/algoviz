import type { StepKind } from '../core/protocol';

/** Shared between the cell inspector and the board's live narration, so the
 *  same event is always named and coloured the same way wherever it shows up. */
export const STEP_KINDS: Record<StepKind, { label: string; tone: string }> = {
  visit: { label: 'Expanded', tone: 'bg-brand text-white' },
  discover: { label: 'Discovered', tone: 'bg-frontier text-brand' },
  reopen: { label: 'Re-routed', tone: 'bg-sunken text-ink-muted' },
  skip: { label: 'Skipped', tone: 'bg-sunken text-ink-muted' },
  path: { label: 'On the path', tone: 'bg-path text-white' }
};
