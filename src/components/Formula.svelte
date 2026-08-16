<script lang="ts">
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  type Props = {
    tex: string;
    /** Centred on its own line rather than sitting in a sentence. */
    display?: boolean;
    class?: string;
  };

  let { tex, display = false, class: className = '' }: Props = $props();

  // `trust` stays at its default of false, so no LaTeX command can emit a link
  // or raw HTML -- which matters because one of these strings is built from a
  // formula the user typed.
  const html = $derived(
    katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      output: 'html',
      strict: false
    })
  );
</script>

<!--
  KaTeX emits markup, so {@html} is the only way to mount it. The output is
  safe here: `trust` is left at its default of false, which disables every
  command that can produce a link or raw HTML (\href, \url, \includegraphics),
  and KaTeX escapes the text it does emit. The one input not written by us is a
  user formula, and that reaches this component only after mathjs has parsed it
  and re-serialised it through toTex().
-->
<!-- eslint-disable svelte/no-at-html-tags -->
{#if display}
  <div class={className}>{@html html}</div>
{:else}
  <span class={className}>{@html html}</span>
{/if}
