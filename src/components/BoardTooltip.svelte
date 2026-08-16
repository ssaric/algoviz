<script lang="ts">
  import type { CellInspection } from '../board/Painter';
  import type { StepKind } from '../core/protocol';

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

  const WIDTH = 330;
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

  const round = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

<aside
  class="thoughts border-line bg-surface/95 shadow-float pointer-events-none fixed z-20 max-h-[45vh] overflow-y-auto rounded-2xl border p-4 backdrop-blur"
  style:left="{left}px"
  style:top={below ? `${top}px` : 'auto'}
  style:bottom={below ? 'auto' : `${bottom}px`}
  style:width="{WIDTH}px"
>
  <header class="text-ink-subtle mb-3 text-xs font-semibold tracking-wider uppercase">
    Cell {inspection.cell.x}, {inspection.cell.y}
  </header>

  <ol class="m-0 flex list-none flex-col gap-3 p-0">
    {#each inspection.steps as step, index (index)}
      <li class="border-line border-t pt-3 first:border-t-0 first:pt-0">
        <span
          class="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase {KINDS[
            step.kind
          ].tone}"
        >
          {KINDS[step.kind].label}
        </span>
        <p class="text-ink mt-2 text-sm leading-relaxed">{step.note}</p>
        <dl class="text-ink-subtle mt-2 flex gap-4 text-xs tabular-nums">
          <div class="flex gap-1">
            <dt class="font-semibold">g</dt>
            <dd class="m-0">{round(step.g)}</dd>
          </div>
          <div class="flex gap-1">
            <dt class="font-semibold">h</dt>
            <dd class="m-0">{round(step.h)}</dd>
          </div>
          <div class="flex gap-1">
            <dt class="font-semibold">score</dt>
            <dd class="m-0">{round(step.priority)}</dd>
          </div>
        </dl>
      </li>
    {/each}
  </ol>
</aside>
