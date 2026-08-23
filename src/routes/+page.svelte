<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { _ } from 'svelte-i18n';
  import Navbar from '../components/Navbar.svelte';
  import LessonFigure from '../components/LessonFigure.svelte';
  import RichText from '../components/RichText.svelte';
  import { Grid } from '../core/Grid';
  import { findLesson, LESSONS } from '../core/lessons';
  import { shortestPathLength } from '../core/reference';

  const lesson = $derived(findLesson(page.url.searchParams.get('lesson')));
  const lessonIndex = $derived(LESSONS.findIndex((l) => l.id === lesson.id));
  const previous = $derived(lessonIndex > 0 ? LESSONS[lessonIndex - 1] : null);
  const next = $derived(lessonIndex < LESSONS.length - 1 ? LESSONS[lessonIndex + 1] : null);

  // The lede sets up what's about to happen; the rest continues once the
  // figure -- the board(s) -- has been seen. Splitting the body this way is
  // what turns "dashboard, then a wall of text" into "read, look, keep reading".
  const lede = $derived(lesson.body[0]);
  const rest = $derived(lesson.body.slice(1));

  const optimal = $derived(
    shortestPathLength(new Grid({ ...lesson.board, walls: [...lesson.board.walls] }))
  );

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
    <nav
      aria-label={$_('learn.lessonsNav')}
      class="border-line w-72 shrink-0 overflow-y-auto border-r px-3 py-5"
    >
      <h2 class="text-ink-subtle mx-3 mb-3 text-xs font-semibold tracking-wider uppercase">
        {$_('learn.lessonsNav')}
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

    <article class="min-w-0 flex-1 overflow-y-auto px-8 pt-12 pb-20">
      <!-- The reading column: a single centered measure everything below
           lines up against, the way an article does. Figures are allowed to
           breach it slightly (see the figure wrapper below) -- that is the
           one deliberate exception, not a second column. -->
      <div class="mx-auto max-w-[70ch]">
        <header class="text-center">
          <p class="text-ink-subtle mb-3 text-xs font-semibold tracking-wider uppercase">
            {$_('learn.lessonOf', { values: { index: lessonIndex + 1, total: LESSONS.length } })}
          </p>
          <h1 class="text-ink m-0 text-4xl font-semibold tracking-tight text-balance">
            {lesson.title}
          </h1>
        </header>

        <p class="text-ink mt-8 text-lg leading-[1.75]">
          <RichText text={lede} />
        </p>
      </div>

      <!-- The figure: allowed a wider measure than the prose, since two boards
           side by side need the room a 70ch text column would not give them.
           Still centered, still one column -- never a second, competing one. -->
      <LessonFigure
        board={lesson.board}
        layout={lesson.layout}
        variants={lesson.variants}
        {optimal}
        caption={lesson.watchFor}
      />

      <div class="mx-auto max-w-[70ch]">
        {#each rest as paragraph, index (index)}
          <p class="text-ink-muted mt-6 text-[17px] leading-[1.75]">
            <RichText text={paragraph} />
          </p>
        {/each}

        <nav
          aria-label={$_('learn.nextLessonNav')}
          class="border-line mt-14 flex gap-4 border-t pt-6"
        >
          {#if previous}
            <button
              type="button"
              onclick={() => select(previous.id)}
              class="hover:bg-sunken min-w-0 flex-1 cursor-pointer rounded-xl border border-transparent px-4 py-3 text-left"
            >
              <span class="text-ink-subtle block text-xs font-semibold tracking-wide uppercase">
                {$_('learn.previous')}
              </span>
              <span class="text-ink mt-1 block truncate text-sm font-semibold">
                {previous.title}
              </span>
            </button>
          {:else}
            <span class="flex-1"></span>
          {/if}
          {#if next}
            <button
              type="button"
              onclick={() => select(next.id)}
              class="hover:bg-sunken min-w-0 flex-1 cursor-pointer rounded-xl border border-transparent px-4 py-3 text-right"
            >
              <span class="text-ink-subtle block text-xs font-semibold tracking-wide uppercase">
                {$_('learn.next')}
              </span>
              <span class="text-ink mt-1 block truncate text-sm font-semibold">{next.title}</span>
            </button>
          {:else}
            <span class="flex-1"></span>
          {/if}
        </nav>
      </div>
    </article>
  </div>
</main>
