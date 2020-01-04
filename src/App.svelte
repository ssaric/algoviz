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

<script>
    import {onDestroy} from 'svelte';

    import Navbar from './components/Navbar.svelte';
    import PlaybackControls from './components/loader/PlaybackControls.svelte';
    import MessageTypes from './enums/MessageTypes';
    import Grid from './components/grid/Grid.svelte';
    import FieldType from './enums/field-type';
    import Legend from './components/legend/Legend.svelte';
    import {getPositionFromDataset} from './util';
    import Noty from 'noty';
    import {
        faPlayCircle,
        faDotCircle,
        faSquareFull
    } from '@fortawesome/free-solid-svg-icons';
    import {icon} from '@fortawesome/fontawesome-svg-core';

    const worker = new Worker('algorithmMincer.worker.js');
    let steps = [];

    worker.onmessage = function (e) {
        const data = e.data[1];
        if (data.type === 'start') steps = [];
        processStep(data);
        nrOfSteps = steps.length;
        if (!interval) startVisualizingSteps();
    }

    let table;
    let fieldType = FieldType.WALL;
    let nrOfRows;
    let nrOfCells;
    let interval;
    let nrOfSteps = 0;
    let currentStep = 0;
    onDestroy(() => worker.terminate());

    function onItemClick({detail}) {
        fieldType = detail.id;
    }

    function startVisualizingSteps() {
        interval = setInterval(() => {
            if (currentStep > nrOfSteps - 1) {
                removeInterval();
                return;
            }
            steps[currentStep++]('forward');
        }, 50);
    }

    function onResetGrid() {
        steps = [];
    }

    const elementsData = {
        walls: {
            text: 'walls',
            icon: icon(faSquareFull).html[0]
        },
        startPosition: {
            text: 'start position',
            icon: icon(faPlayCircle).html[0]
        },
        endPosition: {
            text: 'end position',
            icon: icon(faDotCircle).html[0]
        }
    }

    function removeInterval() {
        clearInterval(interval);
        interval = null;
    }

    function getGridData() {
        const walls = table.getElementsByClassName('cell--wall');
        const startPosition = table.getElementsByClassName('cell--start');
        const endPosition = table.getElementsByClassName('cell--end')
        return {
            walls,
            startPosition,
            endPosition
        }
    }

    function canProcessData(gridData) {
        return (gridData.walls.length !== 0 && gridData.startPosition.length !== 0 && gridData.endPosition.length !== 0);
    }

    function onStopClick() {
        removeInterval()
    }

    function onPlayClick() {
        const gridData = getGridData();

        if (!canProcessData(gridData)) {
            const missingData = [];
            for (const data in gridData) {
                if (gridData[data].length === 0) missingData.push(`${elementsData[data].text} ${elementsData[data].icon} `);
            }
            new Noty({
                type: 'error',
                layout: 'bottom',
                text: `Cannot process algorithm, following data is missing: ${missingData.join(', ')}`
            }).show();
        } else if (steps.length === 0) {
            processData(gridData);
        } else {
            startVisualizingSteps();
        }
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
            setTimeout(() => steps[i]('forward'), 0);
        }
    }

    function skipBackward(start, nrOfSteps) {
        for (let i = start; i > start + nrOfSteps; i--) {
            setTimeout(() => steps[i]('backward'), 0);
        }
    }

    function onManualLoaderChange(e) {
        removeInterval();
        const value = parseInt(e.detail.target.value, 10);
        const nrOfSteps = value - currentStep;
        const direction = nrOfSteps > 0 ? 'forward' : 'backward';
        if (direction === 'forward') skipForward(currentStep, nrOfSteps)
        else if (direction === 'backward') skipBackward(currentStep, nrOfSteps);
        currentStep = value;
    }


    function stepForward(element, step) {
        highlightElement(element);
        switch (step.type) {
            case 'visit': {
                return element.classList.add('cell--visited');
            }
            case 'discover': {
                return element.classList.add('cell--discovered');
            }
            case 'markPath': {
                return element.classList.add('cell--path');
            }
        }
    }

    function stepBackward(element, step) {
        highlightElement(element);
        switch (step.type) {
            case 'visit': {
                return element.classList.remove('cell--visited');
            }
            case 'discover': {
                return element.classList.remove('cell--discovered');
            }
            case 'markPath': {
                return element.classList.remove('cell--path');
            }
        }
    }

    function createGridPaintMove(element, step, direction) {
        if (direction === 'forward') stepForward(element, step);
        else if (direction === 'backward') stepBackward(element, step);
    }

    function highlightElement(element) {
        element.classList.add('cell--highlighted');
        setTimeout(() => element.classList.remove('cell--highlighted'), 200);
    }

    function processStep(step) {
        const element = document.getElementById(String(step.location));
        steps.push(direction => createGridPaintMove(element, step, direction))
    }

    function processData(gridData) {
        const walls = [...gridData.walls];
        const wallPositions = walls.map(w => getPositionFromDataset(w));
        const startPosition = getPositionFromDataset(gridData.startPosition[0])
        const endPosition = getPositionFromDataset(gridData.endPosition[0])

        worker.postMessage([MessageTypes.GRID_DATA, {
            width: nrOfCells,
            height: nrOfRows,
            start: startPosition,
            end: endPosition,
            walls: wallPositions
        }]);
    }


</script>

<main class="root-container">
    <Navbar/>
    <div class="home">
        <Legend on:legendItemClick={onItemClick} selectedFieldType={fieldType}/>
        <PlaybackControls hasData={steps.length > 0}
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
                  selectedFieldType={fieldType}/>
    </div>
</main>
