<script lang="ts">
  import { onMount } from 'svelte';
  import { DEFAULT_CUSTOM_FORMULA } from '../../core/heuristics';

  type Props = {
    onApplyFormula: (formula: string) => void;
  };

  let { onApplyFormula }: Props = $props();

  let formula = $state(DEFAULT_CUSTOM_FORMULA);

  // Publish once on mount so "Custom" is never selected without a formula
  // behind it. Typing must not re-apply, or every keystroke would restart the
  // visualization.
  onMount(() => onApplyFormula(formula));
</script>

<div class="custom-heuristics">
  <span class="custom-heuristics__text">
    Input a custom heuristics formula using the variables
    <code>x</code> and <code>y</code>
    representing respective horizontal and vertical distances. The formula will be parsed via
    <a target="_blank" rel="noreferrer" href="https://mathjs.org/docs/expressions/parsing.html">
      math.js
    </a>
  </span>
  <input bind:value={formula} placeholder="formula" aria-label="Custom heuristic formula" />
  <button type="button" onclick={() => onApplyFormula(formula)}>Apply</button>
</div>

<style lang="scss">
  .custom-heuristics {
    display: flex;
    flex-direction: column;
  }

  .custom-heuristics__text {
    padding: 10px;
  }
</style>
