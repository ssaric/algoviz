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

  const swatches = [
    { color: 'bg-brand', label: 'Visited' },
    { color: 'bg-frontier', label: 'Discovered' },
    { color: 'bg-path', label: 'Final path' }
  ];
</script>

<div class="flex w-full shrink-0 items-start gap-6 px-6 py-5">
  <AlgorithmPicker value={algorithm} onChange={onAlgorithmChange} />
  <HeuristicsPicker disabled={!ALGORITHMS[algorithm].usesHeuristic} onChange={onHeuristicChange} />

  <button
    type="button"
    onclick={onResetGrid}
    class="border-line text-ink-muted hover:border-danger hover:text-danger hover:bg-danger-soft mt-6 flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors"
  >
    <Icon name="times" class="size-3.5" />
    <span>Reset grid</span>
  </button>

  <div class="ml-auto flex flex-col items-end gap-2">
    <div class="flex gap-4">
      {#each swatches as swatch (swatch.label)}
        <div class="flex items-center gap-2">
          <span class="border-line-strong size-3.5 rounded border {swatch.color}"></span>
          <span class="text-ink-muted text-xs">{swatch.label}</span>
        </div>
      {/each}
    </div>

    {#if outcome}
      <p data-testid="stats" class="text-ink-subtle text-xs tabular-nums">
        {outcome.stats.visited} expanded &middot; {outcome.stats.discovered} discovered
        {#if outcome.found}
          &middot; path of {outcome.stats.pathLength}
        {/if}
      </p>
    {/if}
  </div>
</div>
