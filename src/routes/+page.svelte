<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import Navbar from '../components/Navbar.svelte';
  import BoardPanel from '../components/learn/BoardPanel.svelte';
  import Controls from '../components/loader/Controls.svelte';
  import BoardTooltip from '../components/BoardTooltip.svelte';
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

<main class="learn">
  <Navbar />

  <div class="learn__body">
    <nav class="lessons" aria-label="Lessons">
      <h2 class="lessons__heading">Lessons</h2>
      <ol class="lessons__list">
        {#each LESSONS as item, index (item.id)}
          <li>
            <button
              type="button"
              class="lessons__item"
              class:lessons__item--active={item.id === lesson.id}
              aria-current={item.id === lesson.id ? 'page' : undefined}
              onclick={() => select(item.id)}
            >
              <span class="lessons__number">{index + 1}</span>
              <span class="lessons__text">
                <span class="lessons__title">{item.title}</span>
                <span class="lessons__hook">{item.hook}</span>
              </span>
            </button>
          </li>
        {/each}
      </ol>
    </nav>

    <article class="lesson">
      <header class="lesson__head">
        <h1 class="lesson__title">{lesson.title}</h1>
        <p class="lesson__watch">{lesson.watchFor}</p>
      </header>

      <div class="lesson__boards">
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

      <div class="lesson__transport">
        <input
          type="range"
          class="lesson__scrubber"
          min="0"
          max={runnerState.totalSteps}
          step="1"
          aria-label="Timeline"
          value={runnerState.cursor}
          oninput={(event) => runner?.seek(parseInt(event.currentTarget.value, 10))}
        />
        <div class="lesson__transport-row">
          <span class="lesson__count">
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
          <button type="button" class="lesson__replay" onclick={() => runner?.run()}>
            Run again
          </button>
        </div>
      </div>

      <div class="lesson__body">
        {#each lesson.body as paragraph, index (index)}
          <p>{paragraph}</p>
        {/each}
      </div>
    </article>
  </div>

  {#if inspection}
    <BoardTooltip {inspection} />
  {/if}
</main>

<style lang="scss">
  @use '../scss/theme' as *;

  .learn {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: $color-neutral5;
  }

  .learn__body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .lessons {
    width: 290px;
    flex-shrink: 0;
    overflow-y: auto;
    padding: 20px 12px;
    border-right: 1px solid $color-neutral10;
    display: block;
  }

  .lessons__heading {
    font-size: $font-size-caption;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $color-neutral40;
    margin: 0 0 10px 12px;
  }

  .lessons__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: block;
  }

  .lessons__item {
    display: flex;
    gap: 10px;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;

    &:hover {
      background: $color-neutral10;
    }

    &--active {
      background: $color-neutral60;

      .lessons__title,
      .lessons__number {
        color: $color-neutral5;
      }

      .lessons__hook {
        color: $color-neutral20;
      }
    }
  }

  .lessons__number {
    font-size: $font-size-caption;
    font-weight: 700;
    color: $color-neutral40;
    width: 14px;
    flex-shrink: 0;
  }

  .lessons__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .lessons__title {
    font-size: $font-size-body2;
    font-weight: 600;
    color: $color-neutral70;
  }

  .lessons__hook {
    font-size: $font-size-caption;
    line-height: 1.35;
    color: $color-neutral50;
  }

  .lesson {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 24px 32px 48px;
    display: block;
  }

  .lesson__title {
    font-size: 28px;
    font-weight: 600;
    color: $color-neutral70;
    margin: 0;
  }

  .lesson__watch {
    margin: 8px 0 20px;
    max-width: 70ch;
    color: $color-neutral50;
    font-size: $font-size-body2;
    line-height: 1.5;
  }

  .lesson__boards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .lesson__transport {
    margin-top: 14px;
    display: block;
  }

  .lesson__scrubber {
    width: 100%;
  }

  .lesson__transport-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 4px;
  }

  .lesson__count {
    font-size: $font-size-caption;
    color: $color-neutral50;
    font-variant-numeric: tabular-nums;
    width: 140px;
  }

  .lesson__replay {
    width: 140px;
    text-align: right;
    background: none;
    border: none;
    color: $color-primary40;
    font-size: $font-size-caption;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .lesson__body {
    margin-top: 28px;
    max-width: 72ch;
    display: block;

    p {
      margin: 0 0 16px;
      line-height: 1.65;
      color: $color-neutral60;
      font-size: $font-size-body1;
    }
  }
</style>
