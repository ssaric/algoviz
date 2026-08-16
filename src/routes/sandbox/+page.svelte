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

<svelte:head>
  <title>Algoviz — Sandbox</title>
</svelte:head>

<main class="bg-canvas flex h-full w-full flex-col">
  <Navbar />

  <div class="relative flex min-h-0 flex-1 flex-col items-center">
    <Legend
      {algorithm}
      outcome={board.outcome}
      onAlgorithmChange={setAlgorithm}
      onHeuristicChange={setHeuristic}
      onResetGrid={() => painter?.resetGrid()}
    />

    <div id="root" bind:this={boardElement} class="min-h-0 w-full flex-1"></div>

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
  </div>

  {#if board.inspection}
    <BoardTooltip inspection={board.inspection} />
  {/if}
</main>
