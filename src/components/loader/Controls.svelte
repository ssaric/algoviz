<script lang="ts">
  import Icon from '../Icon.svelte';

  type Props = {
    hasData: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onStop: () => void;
    /** Jump several steps -- the "skim" controls. */
    onSkipForward: () => void;
    onSkipBackward: () => void;
    /** Move exactly one step -- for walking through a single decision. */
    onStepForward: () => void;
    onStepBackward: () => void;
  };

  let {
    hasData,
    isPlaying,
    onPlay,
    onStop,
    onSkipForward,
    onSkipBackward,
    onStepForward,
    onStepBackward
  }: Props = $props();

  const ghost =
    'flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors ' +
    'hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-35';
  const ghostSmall =
    'flex size-8 items-center justify-center rounded-full text-ink-muted transition-colors ' +
    'hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-35';
</script>

<div class="flex items-center gap-1">
  <button
    type="button"
    onclick={onSkipBackward}
    disabled={!hasData}
    aria-label="Skip backward"
    class={ghost}
  >
    <Icon name="stepBackward" class="size-4" />
  </button>

  <button
    type="button"
    onclick={onStepBackward}
    disabled={!hasData}
    aria-label="Step back one"
    class={ghostSmall}
  >
    <Icon name="chevronLeft" class="size-3" />
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
    onclick={onStepForward}
    disabled={!hasData}
    aria-label="Step forward one"
    class={ghostSmall}
  >
    <Icon name="chevronRight" class="size-3" />
  </button>

  <button
    type="button"
    onclick={onSkipForward}
    disabled={!hasData}
    aria-label="Skip forward"
    class={ghost}
  >
    <Icon name="stepForward" class="size-4" />
  </button>
</div>
