<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { _ } from 'svelte-i18n';
  import Icon from './Icon.svelte';

  const links = [
    { href: resolve('/'), labelKey: 'nav.learn' },
    { href: resolve('/sandbox'), labelKey: 'nav.sandbox' }
  ];

  const current = $derived(page.url.pathname.replace(/\/$/, '') || '/');
</script>

<nav
  class="border-line bg-surface/85 flex h-16 shrink-0 items-center justify-between gap-6 border-b px-5 backdrop-blur"
>
  <div class="flex items-center gap-3">
    <!-- The mark is a hard-coded white SVG, so it needs something dark behind it. -->
    <span class="bg-ink flex size-9 items-center justify-center rounded-xl">
      <img alt="" src="/logo.svg" class="size-6" />
    </span>
    <span class="text-ink text-lg font-semibold tracking-tight">Algoviz</span>

    <div class="bg-sunken ml-4 flex gap-1 rounded-full p-1">
      {#each links as link (link.href)}
        <a
          href={link.href}
          aria-current={current === link.href ? 'page' : undefined}
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {current ===
          link.href
            ? 'bg-surface text-ink shadow-sm'
            : 'text-ink-muted hover:text-ink'}"
        >
          {$_(link.labelKey)}
        </a>
      {/each}
    </div>
  </div>

  <a
    class="text-ink-subtle hover:text-ink flex size-9 items-center justify-center rounded-lg transition-colors"
    href="https://github.com/ssaric/algoviz"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Icon name="github" label={$_('nav.viewSource')} class="size-5" />
  </a>
</nav>
