<script lang="ts">
  import { onMount } from 'svelte';
  import {
    checkFormula,
    DEFAULT_CUSTOM_FORMULA,
    FORMULA_EXAMPLES,
    SAMPLE_DELTA
  } from '../../core/heuristics';

  type Props = {
    onApplyFormula: (formula: string) => void;
  };

  let { onApplyFormula }: Props = $props();

  let formula = $state(DEFAULT_CUSTOM_FORMULA);
  let applied = $state(DEFAULT_CUSTOM_FORMULA);

  const check = $derived(checkFormula(formula));
  const dirty = $derived(formula !== applied);

  // Publish once on mount so "Custom" is never selected without a formula
  // behind it. Typing must not re-apply, or every keystroke would restart the
  // visualization.
  onMount(() => onApplyFormula(formula));

  function apply() {
    if (!check.ok || !dirty) return;
    applied = formula;
    onApplyFormula(formula);
  }

  function use(example: string) {
    formula = example;
    applied = example;
    onApplyFormula(example);
  }

  const round = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
</script>

<div class="formula">
  <div class="formula__row">
    <input
      class="formula__input"
      class:formula__input--invalid={!check.ok}
      bind:value={formula}
      onkeydown={(event) => event.key === 'Enter' && apply()}
      spellcheck="false"
      autocapitalize="off"
      autocorrect="off"
      placeholder="sqrt(x^2 + y^2)"
      aria-label="Custom heuristic formula"
      aria-invalid={!check.ok}
      aria-describedby="formula-feedback"
    />
    <button type="button" onclick={apply} disabled={!check.ok || !dirty}>Apply</button>
  </div>

  <p
    id="formula-feedback"
    class="formula__feedback"
    class:formula__feedback--error={!check.ok}
    role="status"
  >
    {#if !check.ok}
      {check.error}
    {:else}
      With x = {SAMPLE_DELTA.x}, y = {SAMPLE_DELTA.y} this scores {round(check.sample)}{dirty
        ? ' — press Apply'
        : ''}
    {/if}
  </p>

  <ul class="formula__examples">
    {#each FORMULA_EXAMPLES as example (example.formula)}
      <li>
        <button type="button" class="formula__chip" onclick={() => use(example.formula)}>
          {example.label}
        </button>
      </li>
    {/each}
  </ul>

  <p class="formula__hint">
    <code>x</code> and <code>y</code> are the horizontal and vertical distances to the goal. Parsed
    by
    <a target="_blank" rel="noreferrer" href="https://mathjs.org/docs/expressions/parsing.html">
      math.js
    </a>.
  </p>
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .formula {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
  }

  .formula__row {
    display: flex;
    gap: 6px;
  }

  .formula__input {
    flex: 1;
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid $color-neutral40;
    background: $color-neutral5;
    color: $color-neutral70;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: $font-size-body2;

    &--invalid {
      border-color: #c81e1e;
    }
  }

  .formula__row button {
    height: 34px;
    padding: 0 12px;
    border: none;
    border-radius: 6px;
    background: $color-primary40;
    color: #ffffff;
    font-size: $font-size-caption;
    text-transform: uppercase;
    cursor: pointer;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .formula__feedback {
    margin: 6px 0 0;
    font-size: $font-size-caption;
    color: $color-neutral50;
    min-height: 1.2em;

    &--error {
      color: #c81e1e;
    }
  }

  .formula__examples {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }

  .formula__chip {
    border: 1px solid $color-neutral40;
    background: transparent;
    color: $color-neutral50;
    border-radius: 999px;
    padding: 3px 10px;
    font-size: $font-size-caption;
    cursor: pointer;

    &:hover {
      border-color: $color-primary30;
      color: $color-primary40;
    }
  }

  .formula__hint {
    margin: 8px 0 0;
    font-size: $font-size-caption;
    line-height: 1.4;
    color: $color-neutral50;

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
  }
</style>
