<script lang="ts">
  import type { BoardState, Painter } from '../../board/Painter';
  import { STEP_KINDS } from '../stepKinds';

  type Props = {
    label: string;
    state: BoardState | undefined;
    painter: Painter | undefined;
    /** Length of a genuinely shortest path, for judging the result. */
    optimal: number | null;
    /** Whether the shared clock driving this board is currently running. Not
     *  derived from `state` -- a lesson's boards are seeked by an outside
     *  runner rather than playing their own timeline, so each individual
     *  board's own playing flag never turns on. */
    isPlaying: boolean;
    element: HTMLDivElement | undefined;
  };

  let { label, state, painter, optimal, isPlaying, element = $bindable() }: Props = $props();

  // Reads state.cursor explicitly so this recomputes as the timeline moves --
  // painter itself never changes identity, so calling its method alone would
  // not be reactive. Live rather than frozen at the final outcome: at step 3
  // these are not the same numbers as at the end of the run, and showing the
  // final ones throughout would misrepresent whatever is on screen right now.
  const stats = $derived(painter && state ? painter.statsAt(state.cursor) : null);
  // Reads state.currentStep, not state.cursor -- the two move together, but
  // it's the step itself the narration is about.
  const step = $derived(state?.currentStep ?? null);
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

  <!-- What the algorithm is thinking right now, tied to the playhead rather
       than a hover -- a fixed height so a short note and a long one don't
       shove the board underneath it around. -->
  <div
    class="panel__narration bg-canvas mb-3 flex h-16 shrink-0 flex-col justify-center gap-1 overflow-hidden rounded-xl px-3"
  >
    {#if isPlaying}
      <p class="text-ink-subtle text-xs italic">
        Playing &mdash; pause or step to see what {label} is thinking.
      </p>
    {:else if step}
      <span
        class="w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase {STEP_KINDS[
          step.kind
        ].tone}"
      >
        {STEP_KINDS[step.kind].label}
      </span>
      <p class="text-ink line-clamp-2 text-xs leading-snug">
        Cell ({step.cell.x}, {step.cell.y}): {step.note}
      </p>
    {:else}
      <p class="text-ink-subtle text-xs italic">Press play to watch {label} think.</p>
    {/if}
  </div>

  <div class="relative flex min-h-0 flex-1">
    <div
      bind:this={element}
      class="bg-canvas border-line flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border"
    ></div>
    <!-- Which way each coordinate grows -- cell (x, y) is meaningless without
         it, and it isn't something you can guess from looking at a grid. -->
    <div
      class="text-ink-subtle pointer-events-none absolute top-1.5 left-1.5 flex flex-col gap-0.5 text-[10px] leading-none font-medium"
    >
      <span>x &rarr;</span>
      <span>y &darr;</span>
    </div>
  </div>

  <dl class="panel__stats mt-3 mb-0 flex shrink-0 gap-5 text-xs">
    {#each figures as figure (figure.label)}
      <div class="flex gap-1.5">
        <dt class="text-ink-subtle">{figure.label}</dt>
        <dd class="text-ink m-0 font-semibold tabular-nums">{figure.value ?? 0}</dd>
      </div>
    {/each}
  </dl>
</section>
