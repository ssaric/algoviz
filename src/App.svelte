<style lang="scss" global>
  @import "./scss/index";

  .root-container {
    flex-grow: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
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

<script lang="ts">

    import {onDestroy} from 'svelte';
    import Navbar from './components/Navbar.svelte';
    import {MessageType, AlgorithmWorkerStepType, PlaybackDirection} from "./constants/types";
    import PlaybackControls from './components/loader/PlaybackControls.svelte';
    import Grid from './components/grid/Grid.svelte';
    import Legend from './components/legend/Legend.svelte';
    import {addInfoMessage, infoMessagesMap, heuristics, resetGridData, getGridData} from './store';

    import InfoBubble from './components/grid/InfoBubble.svelte';
    import Painter from "./util/Painter";
    import {get} from "svelte/store";

    const worker = new Worker('worker.js');
    let painter = new Painter(worker);

    let table;
    let mousePosition;
    let infoBubbleContent;
    let infoBubbleVisible;
    let hasData;
    $: {
        worker.postMessage([MessageType.SET_HEURISTICS, $heuristics]);
    }
    const steps = painter._steps;
    const interval = painter._interval;
    const currentStep = painter._currentStep;
    $: {
        hasData = $steps.length > 0;
    }

    worker.onmessage = function (e) {
        const data = e.data[1];
        switch (data.type) {
            case AlgorithmWorkerStepType.START:
                painter.reset();
                resetGridVisualizedSteps();
                return;
            case AlgorithmWorkerStepType.INFO:
                addInfoMessage(data);
                break;
            default:
                painter.addStep(data);

        }
    }

    onDestroy(() => worker.terminate());

    window.onbeforeunload = () => {
        if (worker) worker.terminate();
    }

    function resetGridVisualizedSteps() {
        if (!table) return;
        const cells = table.querySelectorAll('td.cell--visited, td.cell--discovered, td.cell--path');
        [...cells].forEach(e => {
            e.classList.remove('cell--visited');
            e.classList.remove('cell--discovered');
            e.classList.remove('cell--path');
        });
    }

    function onResetGrid() {
        painter.reset();
        resetGridData();
        resetGridVisualizedSteps();
    }


    function renderInfoBubble(e) {
        mousePosition = [e.pageX, e.pageY];
        if (e.target.dataset.cellLocation) {
            infoBubbleContent = $infoMessagesMap[e.target.dataset.cellLocation]
        } else {
            infoBubbleContent = null;
        }
    }

    function onMouseMove(e) {
        // renderInfoBubble(e);
    }


</script>

<main class="root-container"
      on:mousemove={onMouseMove}
>
    <Navbar/>
    <div class="home">
        <Legend on:resetGrid={onResetGrid}/>
        <InfoBubble {mousePosition} content={infoBubbleContent}/>
        <PlaybackControls hasData={hasData}
                          on:playClick={painter.startVisualizingSteps}
                          on:stopClick={painter.stopPlaying}
                          on:backwardClick={painter.skipBackward}
                          on:forwardClick={painter.skipForward}
                          on:loaderChange={painter.onManualLoaderChange}
                          isPlaying={$interval != undefined}
                          nrOfSteps={$steps.length}
                          currentStep={$currentStep}/>
        <Grid bind:table={table}
              on:resetGrid={onResetGrid}
        />
    </div>
</main>