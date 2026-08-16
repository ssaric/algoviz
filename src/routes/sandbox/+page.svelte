<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '../../components/Navbar.svelte';
  import Legend from '../../components/legend/Legend.svelte';
  import PlaybackControls from '../../components/loader/PlaybackControls.svelte';
  import BoardTooltip from '../../components/BoardTooltip.svelte';
  import { Painter, type BoardState } from '../../board/Painter';
  import { DEFAULT_ALGORITHM, type AlgorithmId } from '../../core/algorithms';
  import type { HeuristicSpec } from '../../core/heuristics';

  let boardElement: HTMLDivElement;
  let painter: Painter | undefined;

  let algorithm = $state<AlgorithmId>(DEFAULT_ALGORITHM);

  let board = $state<BoardState>({
    totalSteps: 0,
    cursor: 0,
    isPlaying: false,
    status: 'idle',
    message: null,
    outcome: null,
    currentStep: null,
    inspection: null
  });

  onMount(() => {
    const instance = new Painter(boardElement);
    painter = instance;
    const unsubscribe = instance.subscribe((state) => (board = state));

    return () => {
      unsubscribe();
      instance.destroy();
      painter = undefined;
    };
  });

  const setHeuristic = (spec: HeuristicSpec) => painter?.setHeuristic(spec);

  function setAlgorithm(id: AlgorithmId) {
    algorithm = id;
    painter?.setAlgorithm(id);
  }
</script>

<main class="root-container">
  <Navbar />
  <div class="home">
    <Legend
      {algorithm}
      outcome={board.outcome}
      onAlgorithmChange={setAlgorithm}
      onHeuristicChange={setHeuristic}
      onResetGrid={() => painter?.resetGrid()}
    />
    <PlaybackControls
      totalSteps={board.totalSteps}
      cursor={board.cursor}
      isPlaying={board.isPlaying}
      message={board.message}
      onPlay={() => painter?.solve()}
      onStop={() => painter?.pause()}
      onBackward={() => painter?.skipBackward()}
      onForward={() => painter?.skipForward()}
      onSeek={(cursor) => painter?.seek(cursor)}
    />
    <div id="root" bind:this={boardElement}></div>
    {#if board.inspection}
      <BoardTooltip inspection={board.inspection} />
    {/if}
  </div>
</main>

<style lang="scss">
  @use '../../scss/theme' as *;

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
