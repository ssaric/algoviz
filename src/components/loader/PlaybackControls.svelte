<script lang="ts">
  import { draggable } from '@neodrag/svelte';
  import Controls from './Controls.svelte';
  import Icon from '../Icon.svelte';

  type Props = {
    hasData: boolean;
    nrOfSteps: number;
    currentStep: number;
    onPlay: () => void;
    onStop: () => void;
    onForward: () => void;
    onBackward: () => void;
    onSeek: (step: number) => void;
  };

  let { hasData, nrOfSteps, currentStep, onPlay, onStop, onForward, onBackward, onSeek }: Props =
    $props();

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    event.stopPropagation();
    onSeek(parseInt(event.currentTarget.value, 10));
  }
</script>

<div class="playback-controls" use:draggable={{ handle: '.drag-grip' }}>
  <Icon name="gripHorizontal" class="drag-grip" />
  <div class="loader-wrapper" class:disabled={!hasData}>
    <span>0</span>
    <input
      type="range"
      class="loader"
      min="0"
      max={nrOfSteps - 1}
      step="1"
      aria-label="Timeline"
      oninput={handleInput}
      value={currentStep}
    />
    <span>{nrOfSteps}</span>
  </div>
  <Controls {hasData} {onPlay} {onStop} {onForward} {onBackward} />
</div>

<style lang="scss">
  @use '../../scss/theme' as *;

  .playback-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid $color-neutral40;
    position: absolute;
    bottom: 20px;
    width: 500px;
    border-radius: 10px;
    background: $color-neutral10;
    padding: 10px;
    z-index: 10;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    user-select: none;

    :global(.drag-grip) {
      cursor: grab;
      position: absolute;
      right: calc(50% - 12px);
      top: 4px;
      color: $color-neutral40;
      width: 25px;
      height: 25px;
      z-index: 11;
    }
  }

  .loader-wrapper {
    width: 100%;
    padding: 40px 20px;
    display: flex;
  }

  .loader {
    width: 100%;
    margin: 0 20px;
  }

  input[type='range'] {
    -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
    appearance: none;
    width: 100%; /* Specific width is required for Firefox. */
    background: transparent; /* Otherwise white in Chrome */
  }

  input[type='range']:focus {
    outline: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: 1px solid #000000;
    height: 36px;
    width: 16px;
    border-radius: 3px;
    background: #ffffff;
    cursor: pointer;
    margin-top: -14px; /* Chrome needs an explicit margin; Firefox does not */
    box-shadow:
      1px 1px 1px #000000,
      0px 0px 1px #0d0d0d;
  }

  input[type='range']::-moz-range-thumb {
    box-shadow:
      1px 1px 1px #000000,
      0px 0px 1px #0d0d0d;
    border: 1px solid #000000;
    height: 36px;
    width: 16px;
    border-radius: 3px;
    background: #ffffff;
    cursor: pointer;
  }

  input[type='range']::-webkit-slider-runnable-track {
    width: 100%;
    height: 8.4px;
    cursor: pointer;
    box-shadow:
      1px 1px 1px #000000,
      0px 0px 1px #0d0d0d;
    background: #3071a9;
    border-radius: 1.3px;
    border: 0.2px solid #010101;
  }

  input[type='range']:focus::-webkit-slider-runnable-track {
    background: #367ebd;
  }

  input[type='range']::-moz-range-track {
    width: 100%;
    height: 8.4px;
    cursor: pointer;
    box-shadow:
      1px 1px 1px #000000,
      0px 0px 1px #0d0d0d;
    background: #3071a9;
    border-radius: 1.3px;
    border: 0.2px solid #010101;
  }
</style>
