<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { CellInspection } from '../board/Painter';
  import { ALGORITHMS } from '../core/algorithms';
  import { heuristicTex, HEURISTIC_LABEL_KEYS } from '../core/heuristics';
  import type { Step, StepKind } from '../core/protocol';
  import { describeStepNote } from '../i18n/describe';
  import Formula from './Formula.svelte';
  import { STEP_KINDS as KINDS } from './stepKinds';

  const DIRECTION_KEYS = {
    up: 'direction.up',
    down: 'direction.down',
    left: 'direction.left',
    right: 'direction.right'
  } as const;

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
    if (pull.ratio >= 1.001) return { text: $_('tooltip.verdict.overpays'), tone: 'text-path' };
    if (pull.ratio >= 0.999) return { text: $_('tooltip.verdict.exact'), tone: 'text-brand' };
    return {
      text: $_('tooltip.verdict.underpays', { values: { amount: round(1 - pull.best) } }),
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
    $_('tooltip.trailLabel', {
      values: { kind: $_(KINDS[event.step.kind].labelKey), step: event.index + 1 }
    });
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
    <span class="text-ink text-sm font-semibold"
      >{$_('tooltip.cellHeader', { values: { x: inspection.cell.x, y: inspection.cell.y } })}</span
    >
    <span class="text-ink-subtle text-xs">
      {$_(algorithm.nameKey)}
      {#if usesHeuristic}· {$_(HEURISTIC_LABEL_KEYS[inspection.heuristic.kind])}{/if}
    </span>
  </header>

  <!-- How it got here, and why it is this colour right now. -->
  <section class="bg-canvas mb-3 rounded-xl p-3">
    <span
      class="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase {KINDS[
        painted.step.kind
      ].tone}"
    >
      {$_(KINDS[painted.step.kind].labelKey)}
    </span>

    <p class="text-ink mt-2 text-sm leading-relaxed">{describeStepNote(latest.step.note, $_)}</p>

    {#if inspection.queueRank === 1}
      <p
        class="mt-2 rounded-lg px-2 py-1.5 text-xs font-medium"
        style:background="var(--color-playhead-soft)"
        style:color="var(--color-playhead)"
      >
        {$_('tooltip.checkingNext')}
      </p>
    {:else if inspection.queueRank !== null}
      <p class="text-ink-subtle mt-1.5 text-xs">
        {$_('tooltip.queuePosition', { values: { position: inspection.queueRank } })}
      </p>
    {/if}

    <p class="text-ink-subtle mt-1.5 text-xs">
      {#if arrivedVia}
        {$_('tooltip.arrivedVia', { values: { x: arrivedVia.x, y: arrivedVia.y } })}
      {:else}
        {$_('tooltip.startOfSearch')}
      {/if}
      {$_('tooltip.stepOf', { values: { index: latest.index + 1, total: inspection.totalSteps } })}
    </p>

    {#if trailShown.length > 0}
      <p class="text-ink-subtle mt-1.5 text-xs italic">
        {#if trailHidden > 0}{$_('tooltip.trailHidden', { values: { count: trailHidden } })}
        {/if}
        {trailShown.map(trailLabel).join(' → ')}
      </p>
    {/if}

    <p class="text-ink-subtle mt-2.5 mb-1 text-[11px] font-semibold tracking-wider uppercase">
      {$_('tooltip.scoredBy')}
    </p>
    <Formula tex={algorithm.scoreTex} class="text-ink text-sm" />
    <Formula tex={scoreNow} class="text-ink-muted ml-2 text-sm" />
  </section>

  <!-- Where the heuristic points from here. -->
  <section class="bg-canvas rounded-xl p-3">
    <p class="text-ink-subtle mb-1 text-[11px] font-semibold tracking-wider uppercase">
      {$_('tooltip.whereNext')}
    </p>

    {#if usesHeuristic}
      <p class="text-ink-subtle mb-1 text-xs">{$_('tooltip.scoredByDistance')}</p>
      <Formula tex={heuristic.definition} class="text-ink text-sm" />
      <Formula tex={heuristic.substituted} class="text-ink-muted mt-1 mb-2 text-sm" />
    {/if}

    {#if pull && pull.best > 0}
      <p class="text-ink text-sm leading-relaxed">
        {$_('tooltip.pullSentence.prefix')}
        <strong class="capitalize">{bestDirection ? $_(DIRECTION_KEYS[bestDirection]) : ''}</strong>
        {$_('tooltip.pullSentence.suffix')}
        <strong class="tabular-nums">{round(pull.best)}</strong>.
        <span class={verdict.tone}>{verdict.text}</span>
      </p>

      <div class="mt-2 grid grid-cols-4 gap-1.5 text-center text-[11px]">
        {#each pull.directions as direction (direction.name)}
          <div
            class="rounded-lg px-1 py-1 {direction.deltaH === -pull.best
              ? 'bg-brand-soft text-brand font-semibold'
              : 'text-ink-subtle'}"
          >
            <div class="capitalize">{$_(DIRECTION_KEYS[direction.name])}</div>
            <div class="tabular-nums">
              {direction.deltaH > 0 ? '+' : ''}{round(direction.deltaH)}
            </div>
          </div>
        {/each}
      </div>
    {:else if usesHeuristic}
      <p class="text-ink-muted text-xs leading-relaxed">
        {$_('tooltip.noFavorite')}
      </p>
    {:else}
      <p class="text-ink-muted text-xs leading-relaxed">
        {$_('tooltip.noHeuristic', { values: { algorithmName: $_(algorithm.nameKey) } })}
      </p>
    {/if}
  </section>
</aside>
