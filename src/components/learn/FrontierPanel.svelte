<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { BoardState, Painter } from '../../board/Painter';
  import { ALGORITHMS, type AlgorithmId } from '../../core/algorithms';
  import type { FrontierEntry } from '../../core/frontier';
  import type { StepKind } from '../../core/protocol';
  import Formula from '../Formula.svelte';

  type Props = {
    painter: Painter | undefined;
    state: BoardState | undefined;
    algorithm: AlgorithmId;
    /** Whether the shared clock driving this board is currently running --
     *  see BoardPanel for why this can't be read off `state` itself. */
    isPlaying: boolean;
  };

  let { painter, state, algorithm, isPlaying }: Props = $props();

  /** Past this many rows the list becomes noise; the rest just needs a count. */
  const MAX_ROWS = 6;

  // Reads state.cursor explicitly so this recomputes exactly when the
  // timeline moves -- painter itself never changes identity, so calling its
  // method alone would not be reactive.
  const entries = $derived(painter && state ? painter.frontierAt(state.cursor) : []);
  const overflow = $derived(Math.max(0, entries.length - MAX_ROWS));

  const algo = $derived(ALGORITHMS[algorithm]);

  // Whichever cell is currently hovered on the board, so that row can carry
  // the same outline as the board's own highlight -- hovering a cell and
  // hovering its row in the queue are meant to read as the same thing.
  const highlighted = $derived(state?.inspection?.cell ?? null);
  const isHighlighted = (entry: FrontierEntry) =>
    highlighted !== null && entry.cell.x === highlighted.x && entry.cell.y === highlighted.y;

  // Only these two step kinds change what's on the frontier -- a discover
  // adds a row, a reopen re-scores one already there. Tying the step just
  // taken to the row it produced is what makes "why is this cell on the
  // list" legible without a hover: the same colour the board just painted it
  // shows up as a ring around its row. Gated on pause for the same reason the
  // narration above the board is: during playback this would flicker through
  // several rows a second, which reads as noise rather than an explanation.
  const FRONTIER_CHANGING_KINDS: readonly StepKind[] = ['discover', 'reopen'];
  const RING_COLOR: Partial<Record<StepKind, string>> = {
    discover: 'var(--color-frontier)',
    reopen: 'var(--color-ink-muted)'
  };
  const justChanged = $derived(
    !isPlaying && state?.currentStep && FRONTIER_CHANGING_KINDS.includes(state.currentStep.kind)
      ? state.currentStep
      : null
  );
  const isJustChanged = (entry: FrontierEntry): boolean =>
    justChanged !== null &&
    entry.cell.x === justChanged.cell.x &&
    entry.cell.y === justChanged.cell.y;
  const ringFor = (entry: FrontierEntry): string => {
    if (isHighlighted(entry)) return 'inset 0 0 0 2px var(--color-playhead)';
    if (justChanged && isJustChanged(entry))
      return `inset 0 0 0 2px ${RING_COLOR[justChanged.kind]}`;
    return 'none';
  };

  // A cell that was just discovered or re-ranked usually lands nowhere near
  // the top -- it's new or barely competitive, so the row explaining that is
  // exactly the one "top N by rank" would cut off. Swap it into the last slot
  // rather than let it disappear behind "+N more waiting" the moment it's
  // most relevant. Row count stays fixed either way, so this can't reintroduce
  // the height jump fixed earlier.
  const visible = $derived.by(() => {
    const top = entries.slice(0, MAX_ROWS);
    if (!justChanged || top.some(isJustChanged)) return top;
    const changedEntry = entries.find(isJustChanged);
    return changedEntry ? [...top.slice(0, MAX_ROWS - 1), changedEntry] : top;
  });
  const top = $derived(entries[0]);

  // The frontier only ever needs the fields each algorithm's own score
  // function actually reads: g/h for A*, Dijkstra and greedy, and for
  // breadth-first, `order` -- which is exactly what `priority` already holds
  // for that algorithm, since it scores by discovery order directly.
  const breakdown = (entry: FrontierEntry) =>
    algo.score({ g: entry.g, h: entry.h, order: entry.priority });
</script>

<section
  class="frontier-panel border-line bg-surface shadow-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border p-4"
>
  <header class="mb-1 flex shrink-0 items-baseline justify-between gap-3">
    <h3 class="text-ink m-0 text-sm font-semibold">{$_('frontierPanel.title')}</h3>
    <span class="text-ink-subtle text-xs tabular-nums"
      >{$_('frontierPanel.waitingCount', { values: { count: entries.length } })}</span
    >
  </header>
  <p class="text-ink-subtle mb-3 flex shrink-0 items-center gap-1 text-xs">
    {$_('frontierPanel.rankedByPrefix')}
    <Formula tex={algo.scoreTex} class="text-ink-muted" />
    {$_('frontierPanel.rankedBySuffix')}
  </p>

  {#if entries.length === 0}
    <p class="text-ink-subtle m-0 shrink-0 text-xs leading-relaxed">
      {$_('frontierPanel.empty')}
    </p>
  {:else}
    {#if top}
      <p
        class="bg-brand-soft text-brand mb-3 shrink-0 rounded-lg px-2.5 py-2 text-xs leading-relaxed"
      >
        <strong>{$_('frontierPanel.next', { values: { x: top.cell.x, y: top.cell.y } })}</strong>
        {$_('frontierPanel.affinitySuffix', { values: { affinity: $_(algo.affinityKey) } })}
        <span class="tabular-nums">{breakdown(top)}</span>
      </p>
    {/if}

    <ol class="frontier-panel__list m-0 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-0">
      {#each visible as entry, index (`${entry.cell.x},${entry.cell.y}`)}
        <li
          class="frontier-panel__row flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs {index ===
          0
            ? 'bg-brand-soft text-brand font-semibold'
            : 'text-ink-muted'}"
          style:box-shadow={ringFor(entry)}
        >
          <span class="flex min-w-0 shrink-0 items-center gap-1.5">
            {#if index === 0}
              <span aria-hidden="true">&#9656;</span>
            {/if}
            <span class="tabular-nums">({entry.cell.x}, {entry.cell.y})</span>
            {#if justChanged && isJustChanged(entry)}
              <span
                class="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold tracking-wide uppercase"
                style:background={RING_COLOR[justChanged.kind]}
                style:color="white"
              >
                {justChanged.kind === 'discover'
                  ? $_('frontierPanel.badge.new')
                  : $_('frontierPanel.badge.moved')}
              </span>
            {/if}
          </span>
          <span class="truncate text-right tabular-nums">{breakdown(entry)}</span>
        </li>
      {/each}
      {#if overflow > 0}
        <li class="text-ink-subtle px-2 py-1 text-xs">
          {$_('frontierPanel.moreWaiting', { values: { count: overflow } })}
        </li>
      {/if}
    </ol>
  {/if}
</section>
