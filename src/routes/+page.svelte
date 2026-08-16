<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import Navbar from '../components/Navbar.svelte';
  import BoardPanel from '../components/learn/BoardPanel.svelte';
  import BoardTooltip from '../components/BoardTooltip.svelte';
  import PullArrow from '../components/PullArrow.svelte';
  import RichText from '../components/RichText.svelte';
  import Controls from '../components/loader/Controls.svelte';
  import { LessonRunner, type RunnerState } from '../board/LessonRunner';
  import { Grid } from '../core/Grid';
  import { findLesson, LESSONS } from '../core/lessons';
  import { shortestPathLength } from '../core/reference';

  let left = $state<HTMLDivElement | undefined>();
  let right = $state<HTMLDivElement | undefined>();
  let runner = $state<LessonRunner | undefined>();
  let runnerState = $state<RunnerState>({
    totalSteps: 0,
    cursor: 0,
    isPlaying: false,
    boards: []
  });

  const lesson = $derived(findLesson(page.url.searchParams.get('lesson')));

  // Whichever board the pointer is resting on; only one can be hovered.
  const inspection = $derived(runnerState.boards.find((board) => board.inspection)?.inspection);

  const optimal = $derived(
    shortestPathLength(new Grid({ ...lesson.board, walls: [...lesson.board.walls] }))
  );

  $effect(() => {
    const current = lesson;
    if (!left || !right) return;

    const instance = new LessonRunner([left, right], current.board, current.variants);
    const unsubscribe = instance.subscribe((state) => (runnerState = state));
    runner = instance;
    instance.run();

    return () => {
      unsubscribe();
      instance.destroy();
      runner = undefined;
    };
  });

  const select = (id: string) =>
    // The path is resolved; only the query string varies, which the lint rule
    // cannot verify statically.
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(`${resolve('/')}?lesson=${id}`, { noScroll: true, keepFocus: true });
</script>

<svelte:head>
  <title>Algoviz — {lesson.title}</title>
</svelte:head>

<main class="bg-canvas flex h-full w-full flex-col">
  <Navbar />

  <div class="flex min-h-0 flex-1 overflow-hidden">
    <nav aria-label="Lessons" class="border-line w-72 shrink-0 overflow-y-auto border-r px-3 py-5">
      <h2 class="text-ink-subtle mx-3 mb-3 text-xs font-semibold tracking-wider uppercase">
        Lessons
      </h2>
      <ol class="m-0 list-none p-0">
        {#each LESSONS as item, index (item.id)}
          {@const active = item.id === lesson.id}
          <li>
            <button
              type="button"
              aria-current={active ? 'page' : undefined}
              onclick={() => select(item.id)}
              class="mb-1 flex w-full cursor-pointer gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors {active
                ? 'border-line bg-surface shadow-card'
                : 'hover:bg-sunken border-transparent'}"
            >
              <span
                class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold {active
                  ? 'bg-brand text-white'
                  : 'bg-sunken text-ink-subtle'}"
              >
                {index + 1}
              </span>
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="text-ink text-sm leading-snug font-semibold">{item.title}</span>
                <span class="text-ink-muted text-xs leading-snug">{item.hook}</span>
              </span>
            </button>
          </li>
        {/each}
      </ol>
    </nav>

    <article class="min-w-0 flex-1 overflow-y-auto px-8 pt-7 pb-16">
      <header class="mb-6">
        <h1 class="text-ink m-0 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p class="text-ink-muted mt-2 max-w-[70ch] text-sm leading-relaxed">
          <RichText text={lesson.watchFor} />
        </p>
      </header>

      <div class="grid grid-cols-2 gap-5">
        <BoardPanel
          label={lesson.variants[0].label}
          state={runnerState.boards[0]}
          {optimal}
          bind:element={left}
        />
        <BoardPanel
          label={lesson.variants[1].label}
          state={runnerState.boards[1]}
          {optimal}
          bind:element={right}
        />
      </div>

      <div class="border-line bg-surface shadow-card mt-4 rounded-2xl border px-5 py-3">
        <input
          type="range"
          class="scrubber"
          min="0"
          max={runnerState.totalSteps}
          step="1"
          aria-label="Timeline"
          value={runnerState.cursor}
          oninput={(event) => runner?.seek(parseInt(event.currentTarget.value, 10))}
        />
        <div class="mt-1 flex items-center justify-between gap-4">
          <span class="text-ink-subtle w-36 text-xs tabular-nums">
            {runnerState.cursor} / {runnerState.totalSteps} steps
          </span>
          <Controls
            hasData={runnerState.totalSteps > 0}
            isPlaying={runnerState.isPlaying}
            onPlay={() => runner?.play()}
            onStop={() => runner?.pause()}
            onForward={() => runner?.skip(25)}
            onBackward={() => runner?.skip(-25)}
          />
          <button
            type="button"
            onclick={() => runner?.run()}
            class="text-brand hover:text-brand-bright w-36 cursor-pointer text-right text-xs font-medium"
          >
            Run again
          </button>
        </div>
      </div>

      <div class="mt-8 max-w-[68ch]">
        {#each lesson.body as paragraph, index (index)}
          <p class="text-ink-muted mb-4 text-[15px] leading-[1.7]">
            <RichText text={paragraph} />
          </p>
        {/each}
      </div>
    </article>
  </div>

  {#if inspection}
    <PullArrow {inspection} />
    <BoardTooltip {inspection} />
  {/if}
</main>
