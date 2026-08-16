<script lang="ts">
  import type { CellInspection } from '../board/Painter';
  import { ALGORITHMS } from '../core/algorithms';
  import { heuristicTex, HEURISTIC_LABELS } from '../core/heuristics';
  import type { Step, StepKind } from '../core/protocol';
  import Formula from './Formula.svelte';
  import { STEP_KINDS as KINDS } from './stepKinds';

  type Props = {
    inspection: CellInspection;
  };

  let { inspection }: Props = $props();

  /** Only these three kinds leave a colour on the board -- a reopen or a skip
   *  changes the numbers but not the cell's paint, so "why is it this colour"
   *  has to look past them to whichever of these happened most recently. */
  const PAINTS_CELL: readonly StepKind[] = ['visit', 'discover', 'path'];

  const algorithm = $derived(ALGORITHMS[inspection.algorithm]);
  const usesHeuristic = $derived(algorithm.usesHeuristic);

  /** The freshest thing that happened here at all -- used for the numbers,
   *  since a reopen updates cost without repainting the cell. */
  const latest = $derived(inspection.events[inspection.events.length - 1]);

  /** The freshest thing that actually explains the current colour. */
  const painted = $derived(
    [...inspection.events].reverse().find((e) => PAINTS_CELL.includes(e.step.kind)) ?? latest
  );

  const arrivedVia = $derived(latest.step.parent);

  /** The rest of the history, oldest first, as a single breadcrumb line
   *  rather than a repeating card per event -- the story of how this cell got
   *  here, told in one sentence instead of a log. */
  const MAX_TRAIL = 6;
  const trail = $derived(inspection.events.slice(0, -1));
  const trailShown = $derived(trail.slice(-MAX_TRAIL));
  const trailHidden = $derived(Math.max(0, trail.length - MAX_TRAIL));

  const heuristic = $derived(
    heuristicTex(inspection.heuristic, inspection.delta.dx, inspection.delta.dy, latest.step.h)
  );

  // Only breadth-first reads `order`, and for it priority is the discovery
  // order, so passing it through is exact rather than a stand-in.
  const scoreNow = $derived(
    algorithm.scoreTexFor({ g: latest.step.g, h: latest.step.h, order: latest.step.priority })
  );

  const pull = $derived(inspection.pull);
  const bestDirection = $derived(
    pull?.directions.find((d) => d.deltaH === -pull.best)?.name ?? null
  );

  /** What the gradient means for what happens next from here. */
  const verdict = $derived.by(() => {
    if (!pull) return { text: '', tone: '' };
    if (pull.ratio >= 1.001)
      return {
        text: 'More than the step costs, so f falls as the search advances from here: it will charge straight at the goal, at the cost of the shortest-path guarantee.',
        tone: 'text-path'
      };
    if (pull.ratio >= 0.999)
      return {
        text: 'Exactly what the step costs, so f stays flat from here on an optimal route -- the search will barely wander.',
        tone: 'text-brand'
      };
    return {
      text: `Less than the step costs, so f will creep up by ${round(1 - pull.best)} per move from here. Other directions stay competitive, which is why the search fans out.`,
      tone: 'text-ink-muted'
    };
  });

  const WIDTH = 420;
  const GAP = 10;

  let viewportWidth = $state(1024);
  let viewportHeight = $state(768);

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

  const left = $derived(
    clamp(
      inspection.anchor.left + inspection.anchor.width / 2 - WIDTH / 2,
      GAP,
      viewportWidth - WIDTH - GAP
    )
  );

  // Sit above the cell, but drop below it when there is no room up there.
  const below = $derived(inspection.anchor.top < viewportHeight / 2);
  const top = $derived(inspection.anchor.top + inspection.anchor.height + GAP);
  const bottom = $derived(viewportHeight - inspection.anchor.top + GAP);

  // Cap to the room actually available on the chosen side. The narrative
  // below is short enough that this is rarely reached, but a cell touched
  // many times can still run long, and this is the fallback for that case.
  const maxHeight = $derived(
    Math.max(160, below ? viewportHeight - top - GAP : inspection.anchor.top - 2 * GAP)
  );

  const round = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
  const trailLabel = (event: { index: number; step: Step }) =>
    `${KINDS[event.step.kind].label} (step ${event.index + 1})`;
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

<aside
  class="thoughts border-line bg-surface/95 shadow-float pointer-events-none fixed z-20 overflow-y-auto rounded-2xl border p-4 backdrop-blur"
  style:left="{left}px"
  style:top={below ? `${top}px` : 'auto'}
  style:bottom={below ? 'auto' : `${bottom}px`}
  style:width="{WIDTH}px"
  style:max-height="{maxHeight}px"
>
  <header class="border-line mb-3 flex items-baseline justify-between gap-2 border-b pb-2">
    <span class="text-ink text-sm font-semibold">Cell {inspection.cell.x}, {inspection.cell.y}</span
    >
    <span class="text-ink-subtle text-xs">
      {algorithm.name}
      {#if usesHeuristic}· {HEURISTIC_LABELS[inspection.heuristic.kind]}{/if}
    </span>
  </header>

  <!-- How it got here, and why it is this colour right now. -->
  <section class="bg-canvas mb-3 rounded-xl p-3">
    <span
      class="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase {KINDS[
        painted.step.kind
      ].tone}"
    >
      {KINDS[painted.step.kind].label}
    </span>

    <p class="text-ink mt-2 text-sm leading-relaxed">{latest.step.note}</p>

    {#if inspection.queueRank === 1}
      <p
        class="mt-2 rounded-lg px-2 py-1.5 text-xs font-medium"
        style:background="var(--color-playhead-soft)"
        style:color="var(--color-playhead)"
      >
        Checking this one next &mdash; it is at the top of the queue right now.
      </p>
    {:else if inspection.queueRank !== null}
      <p class="text-ink-subtle mt-1.5 text-xs">
        Currently waiting at position {inspection.queueRank} in the queue.
      </p>
    {/if}

    <p class="text-ink-subtle mt-1.5 text-xs">
      {#if arrivedVia}
        arrived via ({arrivedVia.x}, {arrivedVia.y}) &middot;
      {:else}
        the start of the search &middot;
      {/if}
      step {latest.index + 1} of {inspection.totalSteps}
    </p>

    {#if trailShown.length > 0}
      <p class="text-ink-subtle mt-1.5 text-xs italic">
        {#if trailHidden > 0}&hellip; and {trailHidden} earlier &middot;
        {/if}
        {trailShown.map(trailLabel).join(' → ')}
      </p>
    {/if}

    <p class="text-ink-subtle mt-2.5 mb-1 text-[11px] font-semibold tracking-wider uppercase">
      Scored by
    </p>
    <Formula tex={algorithm.scoreTex} class="text-ink text-sm" />
    <Formula tex={scoreNow} class="text-ink-muted ml-2 text-sm" />
  </section>

  <!-- Where the heuristic points from here. -->
  <section class="bg-canvas rounded-xl p-3">
    <p class="text-ink-subtle mb-1 text-[11px] font-semibold tracking-wider uppercase">
      From here, where next
    </p>

    {#if usesHeuristic}
      <p class="text-ink-subtle mb-1 text-xs">Scored by how far it still looks:</p>
      <Formula tex={heuristic.definition} class="text-ink text-sm" />
      <Formula tex={heuristic.substituted} class="text-ink-muted mt-1 mb-2 text-sm" />
    {/if}

    {#if pull && pull.best > 0}
      <p class="text-ink text-sm leading-relaxed">
        The best step from here is <strong class="capitalize">{bestDirection}</strong> &mdash; it
        drops <em>h</em> by <strong class="tabular-nums">{round(pull.best)}</strong>.
        <span class={verdict.tone}>{verdict.text}</span>
      </p>

      <div class="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
        {#each pull.directions as direction (direction.name)}
          <div
            class="rounded-lg px-1 py-1 {direction.deltaH === -pull.best
              ? 'bg-brand-soft text-brand font-semibold'
              : 'text-ink-subtle'}"
          >
            <div class="capitalize">{direction.name}</div>
            <div class="tabular-nums">
              {direction.deltaH > 0 ? '+' : ''}{round(direction.deltaH)}
            </div>
          </div>
        {/each}
      </div>
    {:else if usesHeuristic}
      <p class="text-ink-muted text-xs leading-relaxed">
        Every direction from here looks equally far from the goal, so nothing about the heuristic
        favours one over another.
      </p>
    {:else}
      <p class="text-ink-muted text-xs leading-relaxed">
        No heuristic: {algorithm.name} does not estimate the remaining distance, so there is no preferred
        direction from here &mdash; every neighbour looks equally worth trying next.
      </p>
    {/if}
  </section>
</aside>
