<script lang="ts">
  import { _ } from 'svelte-i18n';
  import AlgorithmPicker from '../controls/AlgorithmPicker.svelte';
  import HeuristicsPicker from '../controls/HeuristicsPicker.svelte';
  import Icon from '../Icon.svelte';
  import type { Painter } from '../../board/Painter';
  import { ALGORITHMS, type AlgorithmId } from '../../core/algorithms';
  import type { HeuristicSpec } from '../../core/heuristics';
  import type { SearchOutcome } from '../../core/protocol';

  type Props = {
    algorithm: AlgorithmId;
    painter: Painter | undefined;
    cursor: number;
    outcome: SearchOutcome | null;
    onAlgorithmChange: (id: AlgorithmId) => void;
    onHeuristicChange: (spec: HeuristicSpec) => void;
    onResetGrid: () => void;
  };

  let {
    algorithm,
    painter,
    cursor,
    outcome,
    onAlgorithmChange,
    onHeuristicChange,
    onResetGrid
  }: Props = $props();

  // Live rather than frozen at the final outcome, same reasoning as the
  // Learn boards: at step 3 these are not the numbers from the end of the run.
  const stats = $derived(painter ? painter.statsAt(cursor) : null);

  const swatches = [
    { color: 'bg-brand', labelKey: 'sandbox.legend.visited' },
    { color: 'bg-frontier', labelKey: 'sandbox.legend.discovered' },
    { color: 'bg-path', labelKey: 'sandbox.legend.finalPath' }
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
    <span>{$_('sandbox.resetGrid')}</span>
  </button>

  <div class="ml-auto flex flex-col items-end gap-2">
    <div class="flex gap-4">
      {#each swatches as swatch (swatch.labelKey)}
        <div class="flex items-center gap-2">
          <span class="border-line-strong size-3.5 rounded border {swatch.color}"></span>
          <span class="text-ink-muted text-xs">{$_(swatch.labelKey)}</span>
        </div>
      {/each}
    </div>

    {#if stats && stats.visited > 0}
      <p data-testid="stats" class="text-ink-subtle text-xs tabular-nums">
        {$_('sandbox.statsLine', {
          values: { expanded: stats.visited, discovered: stats.discovered }
        })}
        {#if outcome?.found}
          {$_('sandbox.pathOf', { values: { count: outcome.stats.pathLength } })}
        {/if}
      </p>
    {/if}
  </div>
</div>
