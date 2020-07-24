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

<script lang="typescript">
    import {onDestroy} from 'svelte';

    import Navbar from './components/Navbar.svelte';
    import {
        MessageType,
        StepFunction,
        GridData,
        AlgorithmWorkerStepType,
        AlgorithmInfoMessage,
        PlaybackDirection
    } from './constants/types'
    import PlaybackControls from './components/loader/PlaybackControls.svelte';
    import Grid from './components/grid/Grid.svelte';
    import Legend from './components/legend/Legend.svelte';
    import {addInfoMessage, infoMessagesMap, heuristics, resetGridData, getGridData} from './store';
    import Noty from 'noty';

    import InfoBubble from './components/grid/InfoBubble.svelte';
    import {elementsData} from './constants';

    const worker = new Worker('worker.js');

    let steps: Array<StepFunction> = [];

    let table;
    let nrOfRows;
    let nrOfCells;
    let interval;
    let nrOfSteps = 0;
    let currentStep = 0;
    let mousePosition;
    let infoBubbleContent;
    let infoBubbleVisible;

    $: {
        worker.postMessage([MessageType.SET_HEURISTICS, $heuristics]);
    }

    worker.onmessage = function (e) {
        const data = e.data[1];
        switch (data.type) {
            case AlgorithmWorkerStepType.START:
                steps = [];
                return;
            case AlgorithmWorkerStepType.INFO:
                addInfoMessage(data);
                break;
            default:
                processStep(data);
                nrOfSteps = steps.length;
                if (nrOfSteps > 20000) worker.terminate();
                if (!interval) startVisualizingSteps();
        }
    }

    onDestroy(() => worker.terminate());

    window.onbeforeunload = () => {
        if (worker) worker.terminate();
    }


    function startVisualizingSteps() {
        interval = setInterval(() => {
            if (currentStep > nrOfSteps - 1) {
                removeInterval();
                return;
            }
            steps[currentStep++](PlaybackDirection.FORWARD);
        }, 50);
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
        steps = [];
        currentStep = 0;
        nrOfSteps = steps.length;
        resetGridData();
        resetGridVisualizedSteps();
    }

    function removeInterval() {
        clearInterval(interval);
        interval = null;
    }

    function canProcessData() {
        const gridData = getGridData();
        return (gridData.walls.length !== 0 && gridData.start.length !== 0 && gridData.end.length !== 0);
    }

    function showMissingDataToast() {
        const gridData = getGridData();
        const missingData = [];
        for (const data in gridData) {
            if (gridData[data].length === 0) missingData.push(`${elementsData[data].text} ${elementsData[data].icon} `);
        }
        new Noty({
            type: 'error',
            layout: 'bottom',
            text: `Cannot process algorithm, following data is missing: ${missingData.join(', ')}`
        }).show();
    }

    function onPlayClick() {

        if (!canProcessData()) {
            showMissingDataToast();
        } else if (nrOfSteps === 0) {
            processData();
        } else {
            startVisualizingSteps();
        }
    }

    function onStopClick() {
        removeInterval()
    }

    function onBackwardClick() {
        skipBackward(currentStep, -10);
        currentStep = currentStep - 10;
    }

    function onForwardClick() {
        skipForward(currentStep, 10);
        currentStep = currentStep + 10;
    }

    function skipForward(start, nrOfSteps) {
        for (let i = start; i < start + nrOfSteps; i++) {
            setTimeout(() => steps[i](PlaybackDirection.FORWARD), 0);
        }
    }

    function skipBackward(start, nrOfSteps) {
        for (let i = start; i > start + nrOfSteps; i--) {
            setTimeout(() => steps[i](PlaybackDirection.BACKWARD), 0);
        }
    }

    function onManualLoaderChange(e) {
        removeInterval();
        const value = parseInt(e.detail.target.value, 10);
        const nrOfSteps = value - currentStep;
        const direction = nrOfSteps > 0 ? PlaybackDirection.FORWARD : PlaybackDirection.BACKWARD;

        if (direction === PlaybackDirection.FORWARD) skipForward(currentStep, nrOfSteps)
        else if (direction === PlaybackDirection.BACKWARD) skipBackward(currentStep, nrOfSteps);
        currentStep = value;
    }


    function stepForward(element, step) {
        highlightElement(element);
        switch (step.type) {
            case AlgorithmWorkerStepType.VISIT: {
                return element.classList.add('cell--visited');
            }
            case AlgorithmWorkerStepType.DISCOVER: {
                return element.classList.add('cell--discovered');
            }
            case AlgorithmWorkerStepType.MARK_PATH: {
                return element.classList.add('cell--path');
            }
        }
    }

    function stepBackward(element, step) {
        highlightElement(element);
        switch (step.type) {
            case AlgorithmWorkerStepType.VISIT: {
                return element.classList.remove('cell--visited');
            }
            case AlgorithmWorkerStepType.DISCOVER: {
                return element.classList.remove('cell--discovered');
            }
            case AlgorithmWorkerStepType.MARK_PATH: {
                return element.classList.remove('cell--path');
            }
        }
    }

    function createGridPaintMove(element, step, direction) {
        switch (direction) {
            case PlaybackDirection.FORWARD:
                return stepForward(element, step);
            case PlaybackDirection.BACKWARD:
                return stepBackward(element, step);
        }
    }

    function highlightElement(element) {
        element.classList.add('cell--highlighted');
        setTimeout(() => element.classList.remove('cell--highlighted'), 200);
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

    function processStep(step) {
        const element = document.getElementById(String(step.location));
        steps.push(direction => createGridPaintMove(element, step, direction))
    }

    function processData() {
        worker.postMessage([MessageType.GRID_DATA, {
            width: nrOfCells,
            height: nrOfRows,
            ...getGridData(),
            heuristics: $heuristics
        }]);
    }
</script>

<main class="root-container"
      on:mousemove={onMouseMove}
>
    <Navbar/>
    <div class="home">
        <Legend on:resetGrid={onResetGrid}/>
        <InfoBubble {mousePosition} content={infoBubbleContent}/>
        <PlaybackControls hasData={nrOfSteps > 0}
                          on:playClick={onPlayClick}
                                  on:stopClick={onStopClick}
                                  on:backwardClick={onBackwardClick}
                                  on:forwardClick={onForwardClick}
                                  on:loaderChange={onManualLoaderChange}
                                  isPlaying={interval != undefined}
                              {nrOfSteps}
                              {currentStep}/>
            <Grid bind:nrOfRows={nrOfRows}
                  bind:nrOfCells={nrOfCells}
                  bind:table={table}
                  on:resetGrid={onResetGrid}
            />
    </div>
</main>
