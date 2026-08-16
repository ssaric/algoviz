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

<div class="mt-3 flex flex-col">
  <div class="flex gap-2">
    <input
      bind:value={formula}
      onkeydown={(event) => event.key === 'Enter' && apply()}
      spellcheck="false"
      autocapitalize="off"
      autocorrect="off"
      placeholder="sqrt(x^2 + y^2)"
      aria-label="Custom heuristic formula"
      aria-invalid={!check.ok}
      aria-describedby="formula-feedback"
      class="bg-surface text-ink h-10 min-w-0 flex-1 rounded-xl border px-3 font-mono text-sm shadow-sm {check.ok
        ? 'border-line'
        : 'border-danger'}"
    />
    <button
      type="button"
      onclick={apply}
      disabled={!check.ok || !dirty}
      class="bg-brand hover:bg-brand-bright h-10 rounded-xl px-4 text-xs font-semibold tracking-wide text-white uppercase transition-colors disabled:cursor-default disabled:opacity-35"
    >
      Apply
    </button>
  </div>

  <p
    id="formula-feedback"
    role="status"
    class="mt-2 min-h-4 text-xs {check.ok ? 'text-ink-subtle' : 'text-danger'}"
  >
    {#if !check.ok}
      {check.error}
    {:else}
      With x = {SAMPLE_DELTA.x}, y = {SAMPLE_DELTA.y} this scores {round(check.sample)}{dirty
        ? ' — press Apply'
        : ''}
    {/if}
  </p>

  <ul class="mt-2 flex list-none flex-wrap gap-1.5 p-0">
    {#each FORMULA_EXAMPLES as example (example.formula)}
      <li>
        <button
          type="button"
          onclick={() => use(example.formula)}
          class="border-line text-ink-muted hover:border-brand-bright hover:text-brand hover:bg-brand-soft rounded-full border px-2.5 py-1 text-xs transition-colors"
        >
          {example.label}
        </button>
      </li>
    {/each}
  </ul>

  <p class="text-ink-subtle mt-2 text-xs leading-relaxed">
    <code class="font-mono">x</code> and <code class="font-mono">y</code> are the horizontal and
    vertical distances to the goal. Parsed by
    <a
      target="_blank"
      rel="noreferrer"
      href="https://mathjs.org/docs/expressions/parsing.html"
      class="text-brand underline">math.js</a
    >.
  </p>
</div>
