<script lang="ts">
  import { draggable } from '@neodrag/svelte';
  import Controls from './Controls.svelte';
  import Icon from '../Icon.svelte';

  type Props = {
    totalSteps: number;
    cursor: number;
    isPlaying: boolean;
    message: string | null;
    onPlay: () => void;
    onStop: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onStepForward: () => void;
    onStepBackward: () => void;
    onSeek: (cursor: number) => void;
  };

  let {
    totalSteps,
    cursor,
    isPlaying,
    message,
    onPlay,
    onStop,
    onSkipForward,
    onSkipBackward,
    onStepForward,
    onStepBackward,
    onSeek
  }: Props = $props();

  const hasData = $derived(totalSteps > 0);

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    event.stopPropagation();
    onSeek(parseInt(event.currentTarget.value, 10));
  }
</script>

<div
  use:draggable={{ handle: '.drag-grip' }}
  class="border-line bg-surface/95 shadow-float absolute bottom-6 z-10 w-[520px] max-w-[calc(100%-2rem)] rounded-2xl border px-5 pt-3 pb-4 backdrop-blur select-none"
>
  <div class="drag-grip text-ink-subtle hover:text-ink-muted flex cursor-grab justify-center pb-1">
    <Icon name="gripHorizontal" class="size-4" />
  </div>

  {#if message}
    <p role="status" class="text-ink-muted mb-2 text-center text-sm">{message}</p>
  {/if}

  <div class:opacity-40={!hasData} class:pointer-events-none={!hasData}>
    <input
      type="range"
      class="scrubber"
      min="0"
      max={totalSteps}
      step="1"
      aria-label="Timeline"
      oninput={handleInput}
      value={cursor}
    />
    <div class="text-ink-subtle flex justify-between text-xs tabular-nums">
      <span>{cursor}</span>
      <span>{totalSteps} steps</span>
    </div>
  </div>

  <div class="mt-2 flex justify-center">
    <Controls
      {hasData}
      {isPlaying}
      {onPlay}
      {onStop}
      {onSkipForward}
      {onSkipBackward}
      {onStepForward}
      {onStepBackward}
    />
  </div>
</div>
