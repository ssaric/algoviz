<script lang="ts">
  import { Heuristics } from '../../constants/types';
  import { heuristics } from '../../store';
  import CustomHeuristicsPicker from './CustomHeuristicsPicker.svelte';
  import Icon from '../Icon.svelte';

  type Props = {
    onResetGrid: () => void;
  };

  let { onResetGrid }: Props = $props();

  const heuristicChoices = [
    { value: Heuristics.MANHATTAN, name: 'Manhattan' },
    { value: Heuristics.EUCLIDEAN, name: 'Euclidean' },
    { value: Heuristics.CUSTOM, name: 'Custom' }
  ];

  let heuristicsValue = $state<Heuristics>(Heuristics.EUCLIDEAN);

  // While "Custom" is selected the formula picker owns the store, so publishing
  // a bare { type: CUSTOM } here would leave it without a formula to evaluate.
  $effect(() => {
    if (heuristicsValue === Heuristics.CUSTOM) return;
    heuristics.set({ type: heuristicsValue });
  });

  function applyFormula(formula: string) {
    heuristics.set({ type: Heuristics.CUSTOM, formula });
  }
</script>

<div class="heuristics">
  <div class="heuristics-picker">
    <select bind:value={heuristicsValue} aria-label="Heuristic">
      {#each heuristicChoices as choice (choice.value)}
        <option value={choice.value}>{choice.name}</option>
      {/each}
    </select>
    {#if heuristicsValue === Heuristics.CUSTOM}
      <CustomHeuristicsPicker onApplyFormula={applyFormula} />
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
