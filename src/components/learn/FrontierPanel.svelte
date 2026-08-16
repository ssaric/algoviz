<script lang="ts">
  import type { BoardState, Painter } from '../../board/Painter';
  import { ALGORITHMS, type AlgorithmId } from '../../core/algorithms';
  import type { FrontierEntry } from '../../core/frontier';
  import Formula from '../Formula.svelte';

  type Props = {
    painter: Painter | undefined;
    state: BoardState | undefined;
    algorithm: AlgorithmId;
  };

  let { painter, state, algorithm }: Props = $props();

  /** Past this many rows the list becomes noise; the rest just needs a count. */
  const MAX_ROWS = 6;

  // Reads state.cursor explicitly so this recomputes exactly when the
  // timeline moves -- painter itself never changes identity, so calling its
  // method alone would not be reactive.
  const entries = $derived(painter && state ? painter.frontierAt(state.cursor) : []);
  const visible = $derived(entries.slice(0, MAX_ROWS));
  const overflow = $derived(Math.max(0, entries.length - MAX_ROWS));

  const algo = $derived(ALGORITHMS[algorithm]);
  const top = $derived(visible[0]);

  // Whichever cell is currently hovered on the board, so that row can carry
  // the same outline as the board's own highlight -- hovering a cell and
  // hovering its row in the queue are meant to read as the same thing.
  const highlighted = $derived(state?.inspection?.cell ?? null);
  const isHighlighted = (entry: FrontierEntry) =>
    highlighted !== null && entry.cell.x === highlighted.x && entry.cell.y === highlighted.y;

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
    <h3 class="text-ink m-0 text-sm font-semibold">Frontier</h3>
    <span class="text-ink-subtle text-xs tabular-nums">{entries.length} waiting</span>
  </header>
  <p class="text-ink-subtle mb-3 flex shrink-0 items-center gap-1 text-xs">
    Ranked by <Formula tex={algo.scoreTex} class="text-ink-muted" />, lowest first
  </p>

  {#if entries.length === 0}
    <p class="text-ink-subtle m-0 shrink-0 text-xs leading-relaxed">
      Nothing on the frontier yet. Press play to start the search.
    </p>
  {:else}
    {#if top}
      <p
        class="bg-brand-soft text-brand mb-3 shrink-0 rounded-lg px-2.5 py-2 text-xs leading-relaxed"
      >
        <strong>Next: ({top.cell.x}, {top.cell.y})</strong> &mdash; {algo.affinity}.
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
          style:box-shadow={isHighlighted(entry) ? 'inset 0 0 0 2px var(--color-playhead)' : 'none'}
        >
          <span class="flex shrink-0 items-center gap-1.5">
            {#if index === 0}
              <span aria-hidden="true">&#9656;</span>
            {/if}
            <span class="tabular-nums">({entry.cell.x}, {entry.cell.y})</span>
          </span>
          <span class="truncate text-right tabular-nums">{breakdown(entry)}</span>
        </li>
      {/each}
      {#if overflow > 0}
        <li class="text-ink-subtle px-2 py-1 text-xs">+{overflow} more waiting</li>
      {/if}
    </ol>
  {/if}
</section>
