<script lang="ts">
  import Formula from './Formula.svelte';

  type Props = {
    /** Prose with inline maths between single dollar signs: `costs $g + h$ here`. */
    text: string;
  };

  let { text }: Props = $props();

  type Segment = { kind: 'text' | 'math'; value: string };

  // Odd-numbered pieces of a split on `$` are the maths; an unclosed delimiter
  // therefore stays plain text rather than swallowing the rest of the sentence.
  const segments = $derived.by((): Segment[] => {
    const pieces = text.split('$');
    if (pieces.length % 2 === 0) return [{ kind: 'text', value: text }];
    return pieces
      .map((value, index) => ({ kind: index % 2 === 1 ? 'math' : 'text', value }) as Segment)
      .filter((segment) => segment.value !== '');
  });
</script>

{#each segments as segment, index (index)}
  {#if segment.kind === 'math'}
    <Formula tex={segment.value} />
  {:else}
    {segment.value}
  {/if}
{/each}
