<script lang="ts">
  import { ALGORITHM_IDS, ALGORITHMS, type AlgorithmId } from '../../core/algorithms';

  type Props = {
    value: AlgorithmId;
    onChange: (id: AlgorithmId) => void;
  };

  let { value, onChange }: Props = $props();
</script>

<div class="picker">
  <label class="picker__label" for="algorithm">Algorithm</label>
  <select
    id="algorithm"
    {value}
    onchange={(event) => onChange(event.currentTarget.value as AlgorithmId)}
  >
    {#each ALGORITHM_IDS as id (id)}
      <option value={id}>{ALGORITHMS[id].name}</option>
    {/each}
  </select>
  <p class="picker__blurb">{ALGORITHMS[value].blurb}</p>
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .picker {
    display: flex;
    flex-direction: column;
    width: 260px;
  }

  .picker__label {
    font-size: $font-size-caption;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-neutral40;
    margin-bottom: 4px;
  }

  select {
    height: 42px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid $color-neutral40;
    background: $color-neutral5;
    color: $color-neutral70;
    cursor: pointer;
  }

  .picker__blurb {
    margin: 8px 0 0;
    font-size: $font-size-caption;
    line-height: 1.4;
    color: $color-neutral50;
  }
</style>
