<script lang="ts">
  import AlgorithmPicker from '../controls/AlgorithmPicker.svelte';
  import HeuristicsPicker from '../controls/HeuristicsPicker.svelte';
  import Icon from '../Icon.svelte';
  import { ALGORITHMS, type AlgorithmId } from '../../core/algorithms';
  import type { HeuristicSpec } from '../../core/heuristics';
  import type { SearchOutcome } from '../../core/protocol';

  type Props = {
    algorithm: AlgorithmId;
    outcome: SearchOutcome | null;
    onAlgorithmChange: (id: AlgorithmId) => void;
    onHeuristicChange: (spec: HeuristicSpec) => void;
    onResetGrid: () => void;
  };

  let { algorithm, outcome, onAlgorithmChange, onHeuristicChange, onResetGrid }: Props = $props();
</script>

<div class="legend">
  <AlgorithmPicker value={algorithm} onChange={onAlgorithmChange} />
  <HeuristicsPicker disabled={!ALGORITHMS[algorithm].usesHeuristic} onChange={onHeuristicChange} />

  <button type="button" class="reset-button" onclick={onResetGrid}>
    <Icon name="times" />
    <span>Reset Grid</span>
  </button>

  <div class="legend-wrapper">
    <div class="visited-fields">
      <div class="visited-field">
        <div class="visited-field__icon visited-field__icon--visited"></div>
        <span class="visited-field__text">Visited</span>
      </div>
      <div class="visited-field">
        <div class="visited-field__icon visited-field__icon--discovered"></div>
        <span class="visited-field__text">Discovered</span>
      </div>
      <div class="visited-field">
        <div class="visited-field__icon visited-field__icon--final-path"></div>
        <span class="visited-field__text">Final path</span>
      </div>
      {#if outcome}
        <p class="legend__stats" data-testid="stats">
          {outcome.stats.visited} expanded &middot; {outcome.stats.discovered} discovered
          {#if outcome.found}
            &middot; path of {outcome.stats.pathLength}
          {/if}
        </p>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .legend {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    width: 100%;
    padding: 20px;
  }

  .legend-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: flex-end;
  }

  .reset-button {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 42px;
    padding: 0 14px;
    border: none;
    border-radius: 6px;
    background: #c81e1e;
    color: #ffffff;
    font-size: $font-size-button;
    cursor: pointer;
    flex-shrink: 0;
    // Line up with the selects, which sit under their own labels.
    margin-top: 20px;

    :global(svg) {
      height: 14px;
      width: 14px;
    }

    &:hover {
      background: #9b1c1c;
    }
  }

  .visited-fields {
    flex-direction: column;
    display: flex;
    justify-content: flex-end;
    flex: 0 0 auto;
  }

  .visited-field {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .visited-field__icon {
    height: 20px;
    width: 20px;
    border: 1px solid black;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .visited-field__icon--visited {
    background: $color-primary40;
  }

  .visited-field__icon--discovered {
    background: $color-primary20;
  }

  .visited-field__icon--final-path {
    background: $color-secondary50;
  }

  .legend__stats {
    margin: 4px 0 0;
    font-size: $font-size-caption;
    color: $color-neutral50;
  }
</style>
