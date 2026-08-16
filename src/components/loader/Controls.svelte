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

  const ghost =
    'flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors ' +
    'hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-35';
</script>

<div class="flex items-center gap-1">
  <button
    type="button"
    onclick={onBackward}
    disabled={!hasData}
    aria-label="Step backward"
    class={ghost}
  >
    <Icon name="stepBackward" class="size-4" />
  </button>

  <button
    type="button"
    onclick={isPlaying ? onStop : onPlay}
    aria-label={isPlaying ? 'Stop' : 'Play'}
    class="bg-brand hover:bg-brand-bright flex size-12 items-center justify-center rounded-full text-white shadow-sm transition-colors"
  >
    <Icon name={isPlaying ? 'stop' : 'play'} class="size-5" />
  </button>

  <button
    type="button"
    onclick={onForward}
    disabled={!hasData}
    aria-label="Step forward"
    class={ghost}
  >
    <Icon name="stepForward" class="size-4" />
  </button>
</div>
