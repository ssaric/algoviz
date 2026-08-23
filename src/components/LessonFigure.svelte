<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { LessonRunner, type RunnerState } from '../board/LessonRunner';
  import type { SerializedGrid } from '../core/Grid';
  import type { LessonLayout, LessonVariant } from '../core/lessons';
  import BoardTooltip from './BoardTooltip.svelte';
  import BoardPanel from './learn/BoardPanel.svelte';
  import FrontierPanel from './learn/FrontierPanel.svelte';
  import ScoreboardPanel from './learn/ScoreboardPanel.svelte';
  import Controls from './loader/Controls.svelte';
  import PullArrow from './PullArrow.svelte';
  import RichText from './RichText.svelte';

  /**
   * One runnable board figure: the board(s), the frontier/scoreboard panel,
   * transport controls, and the hover popup -- everything a single demo needs,
   * fully self-contained. Originally inline in the Lessons page; pulled out so
   * a reference page can drop down several independent demos on one page
   * without each one re-wiring a LessonRunner by hand. PullArrow/BoardTooltip
   * are `position: fixed`, so nesting this anywhere on the page doesn't change
   * where they render.
   */
  type Props = {
    board: SerializedGrid;
    layout: LessonLayout;
    variants: readonly LessonVariant[];
    /** Length of a genuinely shortest path, for judging the result. Null when
     *  the caller has no reference solve to compare against. */
    optimal: number | null;
    /** Caption shown under the figure -- may contain inline `$...$` maths. */
    caption: string;
  };

  let { board, layout, variants, optimal, caption }: Props = $props();

  let boardEls = $state<(HTMLDivElement | undefined)[]>([]);
  let runner = $state<LessonRunner | undefined>();
  let runnerState = $state<RunnerState>({
    totalSteps: 0,
    cursor: 0,
    isPlaying: false,
    boards: []
  });

  const inspection = $derived(runnerState.boards.find((b) => b.inspection)?.inspection);

  $effect(() => {
    if (layout === 'scoreboard') return;

    const containers = boardEls.slice(0, variants.length);
    if (containers.length !== variants.length || containers.some((el) => !el)) return;

    const instance = new LessonRunner(containers as HTMLDivElement[], board, variants);
    const unsubscribe = instance.subscribe((state) => (runnerState = state));
    runner = instance;
    instance.run();

    return () => {
      unsubscribe();
      instance.destroy();
      runner = undefined;
    };
  });
</script>

<figure class="mx-auto mt-10 {layout === 'frontier' ? 'max-w-[940px]' : 'max-w-[880px]'}">
  {#if layout === 'scoreboard'}
    <ScoreboardPanel {board} {variants} />
  {:else}
    <!-- Fixed height, not just a starting one: the frontier list's row count
         changes every frame during playback, and letting the panel's natural
         height follow it made the whole row -- board included -- visibly
         resize as the search ran. -->
    <div
      class="grid h-[420px] gap-5 {layout === 'frontier' ? 'grid-cols-[1fr_360px]' : 'grid-cols-2'}"
    >
      {#each variants as variant, i (variant.label)}
        <BoardPanel
          label={variant.label}
          state={runnerState.boards[i]}
          painter={runner?.painters[i]}
          {optimal}
          isPlaying={runnerState.isPlaying}
          bind:element={boardEls[i]}
        />
      {/each}
      {#if layout === 'frontier'}
        <FrontierPanel
          painter={runner?.painters[0]}
          state={runnerState.boards[0]}
          algorithm={variants[0].algorithm}
          isPlaying={runnerState.isPlaying}
        />
      {/if}
    </div>

    <div class="border-line bg-surface shadow-card mt-4 rounded-2xl border px-5 py-3">
      <input
        type="range"
        class="scrubber"
        min="0"
        max={runnerState.totalSteps}
        step="1"
        aria-label={$_('controls.timeline')}
        value={runnerState.cursor}
        oninput={(event) => runner?.seek(parseInt(event.currentTarget.value, 10))}
      />
      <div class="mt-1 flex items-center justify-between gap-4">
        <span class="text-ink-subtle w-36 text-xs tabular-nums">
          {$_('learn.cursorOfTotal', {
            values: { cursor: runnerState.cursor, total: runnerState.totalSteps }
          })}
        </span>
        <Controls
          hasData={runnerState.totalSteps > 0}
          isPlaying={runnerState.isPlaying}
          onPlay={() => runner?.play()}
          onStop={() => runner?.pause()}
          onSkipForward={() => runner?.skip(25)}
          onSkipBackward={() => runner?.skip(-25)}
          onStepForward={() => runner?.skip(1)}
          onStepBackward={() => runner?.skip(-1)}
        />
        <button
          type="button"
          onclick={() => runner?.run()}
          class="text-brand hover:text-brand-bright w-36 cursor-pointer text-right text-xs font-medium"
        >
          {$_('learn.runAgain')}
        </button>
      </div>
    </div>
  {/if}

  <figcaption class="text-ink-subtle mx-auto mt-4 max-w-[70ch] text-center text-sm italic">
    <RichText text={caption} />
  </figcaption>
</figure>

{#if inspection}
  <PullArrow {inspection} />
  <BoardTooltip {inspection} />
{/if}
