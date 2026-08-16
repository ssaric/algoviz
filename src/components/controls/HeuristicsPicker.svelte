<script lang="ts">
  import {
    HEURISTIC_BLURBS,
    HEURISTIC_KINDS,
    HEURISTIC_LABELS,
    type HeuristicKind,
    type HeuristicSpec
  } from '../../core/heuristics';
  import CustomHeuristicsPicker from './CustomHeuristicsPicker.svelte';

  type Props = {
    /** Dijkstra and breadth-first ignore the heuristic entirely. */
    disabled: boolean;
    onChange: (spec: HeuristicSpec) => void;
  };

  let { disabled, onChange }: Props = $props();

  let kind = $state<HeuristicKind>('manhattan');

  function selectKind(next: HeuristicKind) {
    kind = next;
    // The formula picker publishes the custom spec itself once it mounts, so
    // "custom" is never announced without a formula behind it.
    if (next !== 'custom') onChange({ kind: next });
  }
</script>

<div class="picker" class:picker--disabled={disabled}>
  <label class="picker__label" for="heuristic">Heuristic</label>
  <select
    id="heuristic"
    value={kind}
    {disabled}
    onchange={(event) => selectKind(event.currentTarget.value as HeuristicKind)}
  >
    {#each HEURISTIC_KINDS as choice (choice)}
      <option value={choice}>{HEURISTIC_LABELS[choice]}</option>
    {/each}
  </select>
  {#if disabled}
    <p class="picker__blurb">This algorithm does not use a heuristic.</p>
  {:else}
    <p class="picker__blurb">{HEURISTIC_BLURBS[kind]}</p>
    {#if kind === 'custom'}
      <CustomHeuristicsPicker onApplyFormula={(formula) => onChange({ kind: 'custom', formula })} />
    {/if}
  {/if}
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .picker {
    display: flex;
    flex-direction: column;
    width: 300px;
  }

  .picker__label {
    font-size: $font-size-caption;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-neutral40;
    margin-bottom: 4px;
  }

  select {
    height: 42px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid $color-neutral40;
    background: $color-neutral5;
    color: $color-neutral70;
    cursor: pointer;
  }

  .picker--disabled select {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .picker__blurb {
    margin: 8px 0 0;
    font-size: $font-size-caption;
    line-height: 1.4;
    color: $color-neutral50;
  }
</style>
