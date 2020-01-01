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
        flex: 1;
        background: $color-neutral5;
    }

</style>

<script>
    import {onDestroy} from 'svelte';

    import Navbar from './components/Navbar.svelte';
    import PlaybackControls from './components/loader/PlaybackControls.svelte';
    import GridTransferObject from './util/Grid';
    import MessageTypes from './enums/MessageTypes';
    import Grid from './components/grid/Grid.svelte';
    import FieldType from './enums/field-type';
    import Legend from './components/legend/Legend.svelte';
    import {getPositionFromDataset} from './util';


    const worker = new Worker('algorithmMincer.worker.js');
    let steps = [];

    worker.onmessage = function (e) {
        const data = e.data[1];
        if (data.type === 'start') steps = [];
        processResults(data);
        nrOfSteps = steps.length;
    }

    let table;
    let fieldType = FieldType.WALL;
    let nrOfRows;
    let numberOfCells;
    let interval;
    let nrOfSteps = 100;
    let currentStep = 0;
    onDestroy(() => worker.terminate());

    function onItemClick({detail}) {
        fieldType = detail.id;
    }


    function onStartClick() {
        createGrid();
    }

    function startVisualizingSteps() {
        interval = setInterval(() => {
            if (currentStep > nrOfSteps - 1) {
                clearInterval(interval);
                return;
            }
            steps[currentStep++]('forward');
        }, 10);
    }

    function onResetGrid() {
        steps = [];
    }

    function onPlayClick() {
        startVisualizingSteps();
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
        console.log(start, nrOfSteps);
        for(let i = start; i < start + nrOfSteps; i++) {
            setTimeout(() => steps[i]('forward'), 0);
        }
    }

    function skipBackward(start, nrOfSteps) {
        console.log(start, nrOfSteps);
        for(let i = start; i > start + nrOfSteps; i--) {
            setTimeout(() => steps[i]('backward'), 0);
        }
    }

    function onManualLoaderChange(e) {
        const value = parseInt(e.detail.target.value, 10);
        const nrOfSteps = value - currentStep;
        console.log(nrOfSteps)
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

    function processStep(element, step, direction) {
        if (direction === 'forward') stepForward(element, step);
        else if (direction === 'backward') stepBackward(element, step);
    }

    function highlightElement(element) {
        element.classList.add('cell--highlighted');
        setTimeout(() => element.classList.remove('cell--highlighted'), 200);
    }

    function processResults(step) {
        const element = document.getElementById(String(step.location));
        steps.push(direction => processStep(element, step, direction))
    }

    function createGrid() {
        const walls = [...table.getElementsByClassName('cell--wall')];
        const wallPositions = walls.map(w => getPositionFromDataset(w));
        const startPosition = getPositionFromDataset(table.getElementsByClassName('cell--start')[0])
        const endPosition = getPositionFromDataset(table.getElementsByClassName('cell--end')[0])

        const gridTransferObject = new GridTransferObject({
            width: numberOfCells,
            height: nrOfRows,
            start: startPosition,
            end: endPosition,
            walls: wallPositions
        });
        worker.postMessage([MessageTypes.GRID_DATA, gridTransferObject.serialize()]);
    }

</script>


<main class="root-container">
    <Navbar/>
    <div class="home">
        <Legend on:startClick={onStartClick} on:legendItemClick={onItemClick} selectedFieldType={fieldType}/>
        <PlaybackControls hasData={steps.length > 0}
                          on:playClick={onPlayClick}
                          on:backwardClick={onBackwardClick}
                          on:forwardClick={onForwardClick}
                          on:loaderChange={onManualLoaderChange}
                          nrOfSteps={nrOfSteps}
                          currentStep={currentStep}
        />
        <Grid bind:nrOfRows={nrOfRows}
              bind:numberOfCells={numberOfCells}
              bind:table={table}
              on:resetGrid={onResetGrid}
              selectedFieldType={fieldType}/>
    </div>
</main>
