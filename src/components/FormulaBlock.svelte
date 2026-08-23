<script lang="ts">
  import Formula from './Formula.svelte';

  type Props = { tex: string; caption?: string };

  let { tex, caption }: Props = $props();
</script>

<div class="border-line bg-sunken mt-6 rounded-xl border px-6 py-5 text-center">
  <Formula {tex} display class="text-ink text-xl" />
  {#if caption}
    <p class="text-ink-muted mt-2 text-sm text-balance">{caption}</p>
  {/if}
</div>
