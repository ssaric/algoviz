<script lang="ts">
  import { highlightTypeScript } from './highlightCode';

  type Props = { code: string };

  let { code }: Props = $props();

  let html = $state<string | null>(null);

  $effect(() => {
    let cancelled = false;
    highlightTypeScript(code).then((result) => {
      if (!cancelled) html = result;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if html}
  <div
    class="code-block mt-6 overflow-hidden rounded-xl border border-line text-[13px] leading-[1.6]"
  >
    {@html html}
  </div>
{:else}
  <pre
    class="bg-sunken border-line text-ink mt-6 overflow-x-auto rounded-xl border px-4 py-3 font-mono text-[13px] leading-[1.6]"><code
      >{code}</code
    ></pre>
{/if}

<style>
  .code-block :global(pre) {
    margin: 0;
    padding: 0.75rem 1rem;
    overflow-x: auto;
    background: var(--color-sunken) !important;
    font-family: ui-monospace, monospace;
  }
</style>
