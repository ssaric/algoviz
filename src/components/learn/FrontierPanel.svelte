<script lang="ts">
  import type { BoardState, Painter } from '../../board/Painter';

  type Props = {
    painter: Painter | undefined;
    state: BoardState | undefined;
  };

  let { painter, state }: Props = $props();

  /** Past this many rows the list becomes noise; the rest just needs a count. */
  const MAX_ROWS = 8;

  // Reads state.cursor explicitly so this recomputes exactly when the
  // timeline moves -- painter itself never changes identity, so calling its
  // method alone would not be reactive.
  const entries = $derived(painter && state ? painter.frontierAt(state.cursor) : []);
  const visible = $derived(entries.slice(0, MAX_ROWS));
  const overflow = $derived(Math.max(0, entries.length - MAX_ROWS));

  const round = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
</script>

<section
  class="frontier-panel border-line bg-surface shadow-card flex min-w-0 flex-col rounded-2xl border p-4"
>
  <header class="mb-3 flex items-baseline justify-between gap-3">
    <h3 class="text-ink m-0 text-sm font-semibold">Frontier</h3>
    <span class="text-ink-subtle text-xs tabular-nums">
      {entries.length} waiting
    </span>
  </header>

  {#if entries.length === 0}
    <p class="text-ink-subtle m-0 text-xs leading-relaxed">
      Nothing on the frontier yet. Press play to start the search.
    </p>
  {:else}
    <ol class="frontier-panel__list m-0 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-0">
      {#each visible as entry, index (`${entry.cell.x},${entry.cell.y}`)}
        <li
          class="frontier-panel__row flex items-center justify-between rounded-lg px-2 py-1.5 text-xs {index ===
          0
            ? 'bg-brand-soft text-brand font-semibold'
            : 'text-ink-muted'}"
        >
          <span class="flex items-center gap-1.5">
            {#if index === 0}
              <span aria-hidden="true">&#9656;</span>
            {/if}
            <span class="tabular-nums">({entry.cell.x}, {entry.cell.y})</span>
          </span>
          <span class="tabular-nums">{round(entry.priority)}</span>
        </li>
      {/each}
      {#if overflow > 0}
        <li class="text-ink-subtle px-2 py-1 text-xs">+{overflow} more waiting</li>
      {/if}
    </ol>
  {/if}
</section>
