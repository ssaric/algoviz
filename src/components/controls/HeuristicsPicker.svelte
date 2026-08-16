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

<div class="flex w-72 flex-col" class:opacity-50={disabled}>
  <label
    for="heuristic"
    class="text-ink-subtle mb-1.5 text-xs font-semibold tracking-wider uppercase"
  >
    Heuristic
  </label>
  <select
    id="heuristic"
    value={kind}
    {disabled}
    onchange={(event) => selectKind(event.currentTarget.value as HeuristicKind)}
    class="border-line bg-surface text-ink hover:border-line-strong h-11 cursor-pointer rounded-xl border px-3 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed"
  >
    {#each HEURISTIC_KINDS as choice (choice)}
      <option value={choice}>{HEURISTIC_LABELS[choice]}</option>
    {/each}
  </select>

  {#if disabled}
    <p class="text-ink-muted mt-2 text-xs leading-relaxed">
      This algorithm does not use a heuristic.
    </p>
  {:else}
    <p class="text-ink-muted mt-2 text-xs leading-relaxed">{HEURISTIC_BLURBS[kind]}</p>
    {#if kind === 'custom'}
      <CustomHeuristicsPicker onApplyFormula={(formula) => onChange({ kind: 'custom', formula })} />
    {/if}
  {/if}
</div>
