<script lang="ts">
  import type { CellInspection } from '../board/Painter';
  import { ALGORITHMS } from '../core/algorithms';
  import { heuristicTex, HEURISTIC_LABELS } from '../core/heuristics';
  import type { StepKind } from '../core/protocol';
  import Formula from './Formula.svelte';

  type Props = {
    inspection: CellInspection;
  };

  let { inspection }: Props = $props();

  const KINDS: Record<StepKind, { label: string; tone: string }> = {
    visit: { label: 'Expanded', tone: 'bg-brand text-white' },
    discover: { label: 'Discovered', tone: 'bg-frontier text-brand' },
    reopen: { label: 'Re-routed', tone: 'bg-sunken text-ink-muted' },
    skip: { label: 'Skipped', tone: 'bg-sunken text-ink-muted' },
    path: { label: 'On the path', tone: 'bg-path text-white' }
  };

  const algorithm = $derived(ALGORITHMS[inspection.algorithm]);
  const usesHeuristic = $derived(algorithm.usesHeuristic);

  /** The last thing that happened here is what the numbers describe. */
  const latest = $derived(inspection.events[inspection.events.length - 1].step);

  const heuristic = $derived(
    heuristicTex(inspection.heuristic, inspection.delta.dx, inspection.delta.dy, latest.h)
  );

  // Only breadth-first reads `order`, and for it priority is the discovery
  // order, so passing it through is exact rather than a stand-in.
  const score = $derived(
    algorithm.scoreTexFor({ g: latest.g, h: latest.h, order: latest.priority })
  );

  const pull = $derived(inspection.pull);

  /** What the gradient means for the shape of the search. */
  const verdict = $derived.by(() => {
    if (!pull) return { text: '', tone: '' };
    if (pull.ratio >= 1.001)
      return {
        text: 'More than the step costs, so f falls as it advances: the search charges at the goal, and the shortest-path guarantee is gone.',
        tone: 'text-path'
      };
    if (pull.ratio >= 0.999)
      return {
        text: 'Exactly what the step costs, so f stays flat along an optimal route and the search barely wanders.',
        tone: 'text-brand'
      };
    return {
      text: `Less than the step costs, so f creeps up by ${round(1 - pull.best)} per move. Rival directions stay competitive and the search fans out.`,
      tone: 'text-ink-muted'
    };
  });

  const WIDTH = 360;
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

  // Cap to the room actually available on the chosen side, so a long history
  // scrolls inside the card instead of running off the screen.
  const maxHeight = $derived(
    Math.max(160, below ? viewportHeight - top - GAP : inspection.anchor.top - 2 * GAP)
  );

  const round = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
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

  <section class="bg-canvas mb-3 rounded-xl p-3">
    {#if usesHeuristic}
      <p class="text-ink-subtle mb-1 text-[11px] font-semibold tracking-wider uppercase">
        Heuristic &mdash; how far it still looks
      </p>
      <Formula tex={heuristic.definition} display class="text-ink text-sm" />
      <Formula tex={heuristic.substituted} display class="text-ink-muted mt-1 text-sm" />
      <p class="text-ink-subtle mt-1.5 text-xs">
        with &Delta;x = {round(inspection.delta.dx)}, &Delta;y = {round(inspection.delta.dy)} to the goal
      </p>
    {:else}
      <p class="text-ink-subtle mb-1 text-[11px] font-semibold tracking-wider uppercase">
        No heuristic
      </p>
      <p class="text-ink-muted text-xs leading-relaxed">
        {algorithm.name} does not estimate the distance remaining, so <em>h</em> stays 0.
      </p>
    {/if}

    <p class="text-ink-subtle mt-3 mb-1 text-[11px] font-semibold tracking-wider uppercase">
      Score &mdash; how it is ordered
    </p>
    <Formula tex={algorithm.scoreTex} display class="text-ink text-sm" />
    <Formula tex={score} display class="text-ink-muted mt-1 text-sm" />
  </section>

  {#if pull && pull.best > 0}
    <section class="bg-canvas mb-3 rounded-xl p-3">
      <p class="text-ink-subtle mb-1 text-[11px] font-semibold tracking-wider uppercase">
        Pull &mdash; how hard it steers
      </p>
      <p class="text-ink text-sm leading-relaxed">
        The best step from here drops <em>h</em> by
        <strong class="tabular-nums">{round(pull.best)}</strong>, and every step costs 1.
      </p>
      <p class="mt-1 text-xs leading-relaxed {verdict.tone}">{verdict.text}</p>

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
    </section>
  {/if}

  <ol class="m-0 flex list-none flex-col gap-3 p-0">
    {#each inspection.events as event (event.index)}
      <li class="border-line border-t pt-3 first:border-t-0 first:pt-0">
        <div class="flex items-center justify-between gap-2">
          <span
            class="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase {KINDS[
              event.step.kind
            ].tone}"
          >
            {KINDS[event.step.kind].label}
          </span>
          <span class="text-ink-subtle text-[11px] tabular-nums">
            step {event.index + 1} of {inspection.totalSteps}
          </span>
        </div>
        <p class="text-ink mt-2 text-sm leading-relaxed">{event.step.note}</p>
        <dl class="text-ink-subtle mt-2 flex gap-4 text-xs tabular-nums">
          <div class="flex gap-1">
            <dt class="font-semibold">g</dt>
            <dd class="m-0">{round(event.step.g)}</dd>
          </div>
          <div class="flex gap-1">
            <dt class="font-semibold">h</dt>
            <dd class="m-0">{round(event.step.h)}</dd>
          </div>
          <div class="flex gap-1">
            <dt class="font-semibold">score</dt>
            <dd class="m-0">{round(event.step.priority)}</dd>
          </div>
        </dl>
      </li>
    {/each}
  </ol>
</aside>
