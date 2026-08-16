<script lang="ts">
  import type { CellInspection } from '../board/Painter';
  import type { StepKind } from '../core/protocol';

  type Props = {
    inspection: CellInspection;
  };

  let { inspection }: Props = $props();

  const KIND_LABELS: Record<StepKind, string> = {
    visit: 'Expanded',
    discover: 'Discovered',
    reopen: 'Re-routed',
    skip: 'Skipped',
    path: 'On the path'
  };

  const WIDTH = 320;
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
  class="thoughts"
  style:left="{left}px"
  style:top={below ? `${top}px` : 'auto'}
  style:bottom={below ? 'auto' : `${bottom}px`}
  style:width="{WIDTH}px"
>
  <header class="thoughts__header">
    Cell {inspection.cell.x}, {inspection.cell.y}
  </header>
  <ol class="thoughts__list">
    {#each inspection.steps as step, index (index)}
      <li class="thoughts__item">
        <span class="thoughts__kind thoughts__kind--{step.kind}">{KIND_LABELS[step.kind]}</span>
        <p class="thoughts__note">{step.note}</p>
        <dl class="thoughts__costs">
          <div>
            <dt>g</dt>
            <dd>{round(step.g)}</dd>
          </div>
          <div>
            <dt>h</dt>
            <dd>{round(step.h)}</dd>
          </div>
          <div>
            <dt>score</dt>
            <dd>{round(step.priority)}</dd>
          </div>
        </dl>
      </li>
    {/each}
  </ol>
</aside>

<style lang="scss">
  @use '../scss/theme' as *;

  .thoughts {
    position: fixed;
    z-index: 20;
    background: $color-neutral70;
    color: $color-neutral5;
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    pointer-events: none;
    max-height: 45vh;
    overflow-y: auto;
  }

  .thoughts__header {
    font-size: $font-size-caption;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-neutral20;
    margin-bottom: 8px;
  }

  .thoughts__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .thoughts__item {
    border-top: 1px solid $color-neutral50;
    padding-top: 8px;

    &:first-child {
      border-top: none;
      padding-top: 0;
    }
  }

  .thoughts__kind {
    display: inline-block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    border-radius: 4px;
    background: $color-neutral50;

    &--visit {
      background: $color-primary40;
    }
    &--discover {
      background: $color-primary30;
    }
    &--path {
      background: $color-secondary50;
    }
  }

  .thoughts__note {
    margin: 6px 0 0;
    font-size: $font-size-body2;
    line-height: 1.45;
  }

  .thoughts__costs {
    display: flex;
    gap: 14px;
    margin: 6px 0 0;
    font-size: $font-size-caption;
    color: $color-neutral20;

    div {
      display: flex;
      gap: 4px;
    }

    dt {
      font-weight: 600;
    }

    dd {
      margin: 0;
    }
  }
</style>
