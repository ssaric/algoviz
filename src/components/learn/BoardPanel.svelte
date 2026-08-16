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
</script>

<section class="panel">
  <header class="panel__head">
    <h3 class="panel__label">{label}</h3>
    {#if settled && stats}
      <span
        class="panel__verdict"
        class:panel__verdict--good={overshoot === 0}
        class:panel__verdict--bad={overshoot !== null && overshoot > 0}
      >
        {#if overshoot === 0}
          shortest path
        {:else if overshoot !== null}
          {overshoot} cells longer
        {/if}
      </span>
    {/if}
  </header>

  <div class="panel__board" bind:this={element}></div>

  <dl class="panel__stats">
    <div>
      <dt>expanded</dt>
      <dd>{stats?.visited ?? '—'}</dd>
    </div>
    <div>
      <dt>discovered</dt>
      <dd>{stats?.discovered ?? '—'}</dd>
    </div>
    <div>
      <dt>path</dt>
      <dd>{stats?.pathLength ?? '—'}</dd>
    </div>
  </dl>
</section>

<style lang="scss">
  @use '../../scss/theme' as *;

  .panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .panel__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .panel__label {
    font-size: $font-size-subtitle2;
    font-weight: 600;
    color: $color-neutral70;
    margin: 0;
  }

  .panel__verdict {
    font-size: $font-size-caption;
    padding: 2px 8px;
    border-radius: 999px;
    background: $color-neutral10;
    color: $color-neutral60;
    white-space: nowrap;

    &--good {
      background: rgba(24, 80, 50, 0.12);
      color: $color-primary40;
    }

    &--bad {
      background: rgba(200, 30, 30, 0.12);
      color: #9b1c1c;
    }
  }

  .panel__board {
    display: flex;
    align-items: center;
    justify-content: center;
    height: clamp(190px, 26vh, 320px);
    background: $color-neutral5;
    border: 1px solid $color-neutral10;
    border-radius: 8px;
    overflow: hidden;
  }

  .panel__stats {
    display: flex;
    gap: 16px;
    margin: 8px 0 0;
    font-size: $font-size-caption;
    color: $color-neutral50;

    div {
      display: flex;
      gap: 5px;
    }

    dt {
      color: $color-neutral40;
    }

    dd {
      margin: 0;
      font-variant-numeric: tabular-nums;
      color: $color-neutral60;
      font-weight: 600;
    }
  }
</style>
