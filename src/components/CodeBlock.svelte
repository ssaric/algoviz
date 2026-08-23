<script lang="ts">
  type Props = { code: string };

  let { code }: Props = $props();
</script>

<pre
  class="bg-sunken border-line text-ink mt-6 overflow-x-auto rounded-xl border px-4 py-3 font-mono text-[13px] leading-[1.6]"><code
    >{code}</code
  ></pre>
