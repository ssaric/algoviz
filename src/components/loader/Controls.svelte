<script lang="ts">
  import Icon from '../Icon.svelte';

  type Props = {
    hasData: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onStop: () => void;
    onForward: () => void;
    onBackward: () => void;
  };

  let { hasData, isPlaying, onPlay, onStop, onForward, onBackward }: Props = $props();
</script>

<div class="controls">
  <button type="button" onclick={onBackward} disabled={!hasData} aria-label="Step backward">
    <Icon name="stepBackward" />
  </button>
  <button type="button" onclick={onPlay} aria-label="Play">
    <Icon name="play" />
  </button>
  <button type="button" onclick={onStop} disabled={!isPlaying} aria-label="Stop">
    <Icon name="stop" />
  </button>
  <button type="button" onclick={onForward} disabled={!hasData} aria-label="Step forward">
    <Icon name="stepForward" />
  </button>
</div>

<style lang="scss">
  .controls {
    width: 300px;
    display: flex;
    align-items: center;
    height: 50px;
    justify-content: space-between;
  }

  button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;

    :global(svg) {
      width: 35px;
      height: 40px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
</style>
