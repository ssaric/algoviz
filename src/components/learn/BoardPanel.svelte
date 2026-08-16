<script lang="ts">
  import type { BoardState, Painter } from '../../board/Painter';

  type Props = {
    label: string;
    state: BoardState | undefined;
    painter: Painter | undefined;
    /** Length of a genuinely shortest path, for judging the result. */
    optimal: number | null;
    element: HTMLDivElement | undefined;
  };

  let { label, state, painter, optimal, element = $bindable() }: Props = $props();

  // Reads state.cursor explicitly so this recomputes as the timeline moves --
  // painter itself never changes identity, so calling its method alone would
  // not be reactive. Live rather than frozen at the final outcome: at step 3
  // these are not the same numbers as at the end of the run, and showing the
  // final ones throughout would misrepresent whatever is on screen right now.
  const stats = $derived(painter && state ? painter.statsAt(state.cursor) : null);
  const settled = $derived(state?.status === 'solved' || state?.status === 'unreachable');
  const outcome = $derived(state?.outcome ?? null);
  const overshoot = $derived(
    outcome && optimal !== null ? outcome.stats.pathLength - optimal : null
  );

  const figures = $derived([
    { label: 'expanded', value: stats?.visited },
    { label: 'discovered', value: stats?.discovered },
    { label: 'path', value: stats?.pathLength }
  ]);
</script>

<section
  class="panel border-line bg-surface shadow-card flex h-full min-w-0 flex-col rounded-2xl border p-4"
>
  <header class="mb-3 flex shrink-0 items-baseline justify-between gap-3">
    <h3 class="text-ink m-0 text-sm font-semibold">{label}</h3>
    {#if settled && outcome}
      <span
        class="panel__verdict rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap {overshoot ===
        0
          ? 'bg-brand-soft text-brand'
          : 'bg-danger-soft text-danger'}"
      >
        {overshoot === 0 ? 'shortest path' : `${overshoot} cells longer`}
      </span>
    {/if}
  </header>

  <div
    bind:this={element}
    class="bg-canvas border-line flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border"
  ></div>

  <dl class="panel__stats mt-3 mb-0 flex shrink-0 gap-5 text-xs">
    {#each figures as figure (figure.label)}
      <div class="flex gap-1.5">
        <dt class="text-ink-subtle">{figure.label}</dt>
        <dd class="text-ink m-0 font-semibold tabular-nums">{figure.value ?? 0}</dd>
      </div>
    {/each}
  </dl>
</section>
