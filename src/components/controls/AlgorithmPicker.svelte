<script lang="ts">
  import { ALGORITHM_IDS, ALGORITHMS, type AlgorithmId } from '../../core/algorithms';

  type Props = {
    value: AlgorithmId;
    onChange: (id: AlgorithmId) => void;
  };

  let { value, onChange }: Props = $props();
</script>

<div class="flex w-64 flex-col">
  <label
    for="algorithm"
    class="text-ink-subtle mb-1.5 text-xs font-semibold tracking-wider uppercase"
  >
    Algorithm
  </label>
  <select
    id="algorithm"
    {value}
    onchange={(event) => onChange(event.currentTarget.value as AlgorithmId)}
    class="border-line bg-surface text-ink hover:border-line-strong h-11 cursor-pointer rounded-xl border px-3 text-sm font-medium shadow-sm transition-colors"
  >
    {#each ALGORITHM_IDS as id (id)}
      <option value={id}>{ALGORITHMS[id].name}</option>
    {/each}
  </select>
  <p class="text-ink-muted mt-2 text-xs leading-relaxed">{ALGORITHMS[value].blurb}</p>
</div>
