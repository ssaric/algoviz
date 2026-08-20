<script lang="ts">
  import { _ } from 'svelte-i18n';
  import {
    HEURISTIC_BLURB_KEYS,
    HEURISTIC_KINDS,
    HEURISTIC_LABEL_KEYS,
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
    {$_('sandbox.heuristicLabel')}
  </label>
  <select
    id="heuristic"
    value={kind}
    {disabled}
    onchange={(event) => selectKind(event.currentTarget.value as HeuristicKind)}
    class="border-line bg-surface text-ink hover:border-line-strong h-11 cursor-pointer rounded-xl border px-3 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed"
  >
    {#each HEURISTIC_KINDS as choice (choice)}
      <option value={choice}>{$_(HEURISTIC_LABEL_KEYS[choice])}</option>
    {/each}
  </select>

  {#if disabled}
    <p class="text-ink-muted mt-2 text-xs leading-relaxed">
      {$_('sandbox.heuristicUnused')}
    </p>
  {:else}
    <p class="text-ink-muted mt-2 text-xs leading-relaxed">{$_(HEURISTIC_BLURB_KEYS[kind])}</p>
    {#if kind === 'custom'}
      <CustomHeuristicsPicker onApplyFormula={(formula) => onChange({ kind: 'custom', formula })} />
    {/if}
  {/if}
</div>
