<script lang="ts">
  import { HEURISTIC_LABELS, type HeuristicKind, type HeuristicSpec } from '../../core/heuristics';
  import CustomHeuristicsPicker from './CustomHeuristicsPicker.svelte';
  import Icon from '../Icon.svelte';

  type Props = {
    onResetGrid: () => void;
    onHeuristicChange: (spec: HeuristicSpec) => void;
  };

  let { onResetGrid, onHeuristicChange }: Props = $props();

  const choices: HeuristicKind[] = ['manhattan', 'euclidean', 'custom'];

  let kind = $state<HeuristicKind>('euclidean');

  function selectKind(next: HeuristicKind) {
    kind = next;
    // The formula picker publishes the custom spec itself once it mounts, so
    // "custom" is never announced without a formula behind it.
    if (next !== 'custom') onHeuristicChange({ kind: next });
  }
</script>

<div class="heuristics">
  <div class="heuristics-picker">
    <select
      value={kind}
      onchange={(event) => selectKind(event.currentTarget.value as HeuristicKind)}
      aria-label="Heuristic"
    >
      {#each choices as choice (choice)}
        <option value={choice}>{HEURISTIC_LABELS[choice]}</option>
      {/each}
    </select>
    {#if kind === 'custom'}
      <CustomHeuristicsPicker
        onApplyFormula={(formula) => onHeuristicChange({ kind: 'custom', formula })}
      />
    {/if}
  </div>
  <div class="button-wrapper">
    <button type="button" class="reset-button" onclick={onResetGrid}>
      <Icon name="times" />
      <span>Reset Grid</span>
    </button>
  </div>
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .heuristics {
    display: flex;
    align-items: flex-start;
  }

  .heuristics-picker {
    display: flex;
    flex-direction: column;
    width: 300px;
    margin-right: 20px;

    select {
      margin: 0;
      height: 42px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid $color-neutral40;
      background: $color-neutral5;
      color: $color-neutral70;
      cursor: pointer;
    }
  }

  .button-wrapper {
    height: 40px;
  }

  .reset-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    background: #c81e1e;
    color: #ffffff;
    font-size: $font-size-button;
    cursor: pointer;

    :global(svg) {
      height: 14px;
      width: 14px;
    }

    &:hover {
      background: #9b1c1c;
    }
  }
</style>
