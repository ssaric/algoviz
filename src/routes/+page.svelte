<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Navbar from '../components/Navbar.svelte';
  import Legend from '../components/legend/Legend.svelte';
  import PlaybackControls from '../components/loader/PlaybackControls.svelte';
  import Painter from '../painter/Painter';
  import { currentStep, steps } from '../store';

  let painter: Painter | undefined;

  const hasData = $derived($steps.length > 0);
  const nrOfSteps = $derived($steps.length);

  onMount(() => {
    painter = new Painter();
    painter.bindEventHandlers();
    painter.loadWorker();
  });

  onDestroy(() => {
    painter?.unbindEventHandlers();
    painter?.algorithmWorker?.terminate();
  });
</script>

<main class="root-container">
  <Navbar />
  <div class="home">
    <Legend onResetGrid={() => painter?.resetGrid()} />
    <PlaybackControls
      {hasData}
      {nrOfSteps}
      currentStep={$currentStep}
      onPlay={() => painter?.startVisualizingSteps()}
      onStop={() => painter?.stopPlaying()}
      onBackward={() => painter?.skipBackward()}
      onForward={() => painter?.skipForward()}
      onSeek={(step) => painter?.seekTo(step)}
    />
    <div id="root"></div>
  </div>
</main>

<style lang="scss">
  @use '../scss/theme' as *;

  .root-container {
    flex-grow: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  #root {
    height: 100%;
    width: 100%;
  }

  .home {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    height: calc(100% - 60px);
    background: $color-neutral5;
  }
</style>
