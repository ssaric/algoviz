<script lang="ts">
  import type { BoardState } from '../../board/Painter';

  type Props = {
    label: string;
    state: BoardState | undefined;
    /** Length of a genuinely shortest path, for judging the result. */
    optimal: number | null;
    element: HTMLDivElement | undefined;
  };

  let { label, state, optimal, element = $bindable() }: Props = $props();

  const stats = $derived(state?.outcome?.stats ?? null);
  const settled = $derived(state?.status === 'solved' || state?.status === 'unreachable');
  const overshoot = $derived(stats && optimal !== null ? stats.pathLength - optimal : null);

  const figures = $derived([
    { label: 'expanded', value: stats?.visited },
    { label: 'discovered', value: stats?.discovered },
    { label: 'path', value: stats?.pathLength }
  ]);
</script>

<section
  class="panel border-line bg-surface shadow-card flex min-w-0 flex-col rounded-2xl border p-4"
>
  <header class="mb-3 flex items-baseline justify-between gap-3">
    <h3 class="text-ink m-0 text-sm font-semibold">{label}</h3>
    {#if settled && stats}
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
    class="bg-canvas border-line flex h-[clamp(190px,26vh,320px)] items-center justify-center overflow-hidden rounded-xl border"
  ></div>

  <dl class="panel__stats mt-3 mb-0 flex gap-5 text-xs">
    {#each figures as figure (figure.label)}
      <div class="flex gap-1.5">
        <dt class="text-ink-subtle">{figure.label}</dt>
        <dd class="text-ink m-0 font-semibold tabular-nums">{figure.value ?? '—'}</dd>
      </div>
    {/each}
  </dl>
</section>
