<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { ALGORITHMS, type AlgorithmId } from '../../core/algorithms';
  import { Grid, type SerializedGrid } from '../../core/Grid';
  import { createHeuristic, type HeuristicSpec } from '../../core/heuristics';
  import { shortestPathLength } from '../../core/reference';
  import { runToCompletion } from '../../core/search';

  type ScoreboardVariant = {
    readonly label: string;
    readonly algorithm: AlgorithmId;
    readonly heuristic: HeuristicSpec;
  };

  type Props = {
    board: SerializedGrid;
    variants: readonly ScoreboardVariant[];
  };

  let { board, variants }: Props = $props();

  type Row = {
    readonly label: string;
    readonly expanded: number;
    readonly overshoot: number;
  };

  // Computed from the real search rather than written down as a constant, so
  // this can never quietly drift from what the app actually does.
  const rows = $derived.by((): Row[] => {
    const reference = new Grid({ ...board, walls: [...board.walls] });
    const optimal = shortestPathLength(reference) ?? 0;

    return variants.map((variant) => {
      const grid = new Grid({ ...board, walls: [...board.walls] });
      const { outcome } = runToCompletion(
        grid,
        ALGORITHMS[variant.algorithm],
        createHeuristic(variant.heuristic)
      );
      return {
        label: variant.label,
        expanded: outcome.stats.visited,
        overshoot: outcome.stats.pathLength - optimal
      };
    });
  });

  const maxExpanded = $derived(Math.max(1, ...rows.map((r) => r.expanded)));
  const maxOvershoot = $derived(Math.max(1, ...rows.map((r) => r.overshoot)));
</script>

<div class="grid gap-5 md:grid-cols-2">
  <section class="border-line bg-surface shadow-card rounded-2xl border p-5">
    <h3 class="text-ink m-0 text-sm font-semibold">{$_('scoreboard.cellsExpanded.title')}</h3>
    <p class="text-ink-subtle mt-1 mb-4 text-xs">{$_('scoreboard.cellsExpanded.subtitle')}</p>
    <ol class="m-0 flex list-none flex-col gap-3 p-0">
      {#each rows as row (row.label)}
        <li>
          <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span class="text-ink-muted font-medium">{row.label}</span>
            <span class="text-ink font-semibold tabular-nums">{row.expanded}</span>
          </div>
          <div class="bg-canvas h-3 w-full rounded-[2px]">
            <div
              class="bg-brand-bright h-full rounded-r-[4px]"
              style:width="{(row.expanded / maxExpanded) * 100}%"
            ></div>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section class="border-line bg-surface shadow-card rounded-2xl border p-5">
    <h3 class="text-ink m-0 text-sm font-semibold">{$_('scoreboard.pathLength.title')}</h3>
    <p class="text-ink-subtle mt-1 mb-4 text-xs">
      {$_('scoreboard.pathLength.subtitle')}
    </p>
    <ol class="m-0 flex list-none flex-col gap-3 p-0">
      {#each rows as row (row.label)}
        <li>
          <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span class="text-ink-muted font-medium">{row.label}</span>
            <span
              class="font-semibold tabular-nums {row.overshoot === 0
                ? 'text-brand'
                : 'text-danger'}"
            >
              {row.overshoot === 0
                ? $_('scoreboard.optimal')
                : $_('scoreboard.extraCells', { values: { count: row.overshoot } })}
            </span>
          </div>
          <div class="bg-canvas h-3 w-full rounded-[2px]">
            <div
              class="bg-path h-full rounded-r-[4px]"
              style:width="{(row.overshoot / maxOvershoot) * 100}%"
            ></div>
          </div>
        </li>
      {/each}
    </ol>
  </section>
</div>
