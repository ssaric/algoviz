<script lang="ts">
  import HeuristicsPicker from '../heuristicsPicker/HeuristicsPicker.svelte';
  import type { HeuristicSpec } from '../../core/heuristics';

  type Props = {
    onResetGrid: () => void;
    onHeuristicChange: (spec: HeuristicSpec) => void;
  };

  let { onResetGrid, onHeuristicChange }: Props = $props();
</script>

<div class="legend">
  <HeuristicsPicker {onResetGrid} {onHeuristicChange} />
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
    </div>
  </div>
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .legend {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    padding: 20px;
  }

  .legend-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .visited-fields {
    flex-direction: column;
    display: flex;
    justify-content: flex-end;
    flex: 1;
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
</style>
