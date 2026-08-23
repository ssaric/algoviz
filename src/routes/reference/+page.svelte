<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import type { Component } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Navbar from '../../components/Navbar.svelte';
  import LessonFigure from '../../components/LessonFigure.svelte';
  import EuclideanGradientDiagram from '../../components/reference/EuclideanGradientDiagram.svelte';
  import RichText from '../../components/RichText.svelte';
  import { Grid } from '../../core/Grid';
  import { shortestPathLength } from '../../core/reference';
  import { findReferencePage, REFERENCE_PAGES } from '../../core/referencePages';

  // A section's `diagram` id maps to a component here, the same way a
  // `demoIndex` maps into `refPage.demos`.
  const DIAGRAMS: Record<string, Component> = { euclideanGradient: EuclideanGradientDiagram };

  const refPage = $derived(findReferencePage(page.url.searchParams.get('page')));

  // Each demo may run on a different board, so "optimal" is computed per demo
  // rather than once per page, unlike the Lessons page (one board per lesson).
  const optimalFor = (index: number) => {
    const demo = refPage.demos[index];
    return shortestPathLength(new Grid({ ...demo.board, walls: [...demo.board.walls] }));
  };

  const select = (id: string) =>
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(`${resolve('/reference')}?page=${id}`, { noScroll: true, keepFocus: true });
</script>

<svelte:head>
  <title>Algoviz — {refPage.title}</title>
</svelte:head>

<main class="bg-canvas flex h-full w-full flex-col">
  <Navbar />

  <div class="flex min-h-0 flex-1 overflow-hidden">
    <nav
      aria-label={$_('reference.pagesNav')}
      class="border-line w-72 shrink-0 overflow-y-auto border-r px-3 py-5"
    >
      <h2 class="text-ink-subtle mx-3 mb-3 text-xs font-semibold tracking-wider uppercase">
        {$_('reference.pagesNav')}
      </h2>
      <ol class="m-0 list-none p-0">
        {#each REFERENCE_PAGES as item (item.id)}
          {@const active = item.id === refPage.id}
          <li>
            <button
              type="button"
              aria-current={active ? 'page' : undefined}
              onclick={() => select(item.id)}
              class="mb-1 flex w-full cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors {active
                ? 'border-line bg-surface shadow-card'
                : 'hover:bg-sunken border-transparent'}"
            >
              <span class="text-ink text-sm leading-snug font-semibold">{item.title}</span>
              <span class="text-ink-muted text-xs leading-snug">{item.hook}</span>
            </button>
          </li>
        {/each}
      </ol>
    </nav>

    <article class="min-w-0 flex-1 overflow-y-auto px-8 pt-12 pb-20">
      <div class="mx-auto max-w-[70ch]">
        <header class="text-center">
          <p class="text-ink-subtle mb-3 text-xs font-semibold tracking-wider uppercase">
            {$_('reference.pagesNav')}
          </p>
          <h1 class="text-ink m-0 text-4xl font-semibold tracking-tight text-balance">
            {refPage.title}
          </h1>
        </header>
      </div>

      {#each refPage.sections as section, index (index)}
        {#if section.kind === 'prose'}
          <div class="mx-auto max-w-[70ch]">
            {#each section.body as paragraph, pIndex (pIndex)}
              {#if index === 0 && pIndex === 0}
                <p class="text-ink mt-8 text-lg leading-[1.75]">
                  <RichText text={paragraph} />
                </p>
              {:else}
                <p class="text-ink-muted mt-6 text-[17px] leading-[1.75]">
                  <RichText text={paragraph} />
                </p>
              {/if}
            {/each}
          </div>
        {:else if section.kind === 'demo'}
          {@const demo = refPage.demos[section.demoIndex]}
          <LessonFigure
            board={demo.board}
            layout={demo.layout}
            variants={demo.variants}
            optimal={optimalFor(section.demoIndex)}
            caption={demo.caption}
          />
        {:else}
          {@const Diagram = DIAGRAMS[section.id]}
          <Diagram />
        {/if}
      {/each}
    </article>
  </div>
</main>
