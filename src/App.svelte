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
    import { onDestroy } from 'svelte';

    import Navbar from './components/Navbar.svelte';
    import Loader from './components/loader/Loader.svelte';
    import GridTransferObject from './util/Grid';
    import MessageTypes from './enums/MessageTypes';
    import Grid from './components/grid/Grid.svelte';
    import FieldType from './enums/field-type';
    import Legend from './components/legend/Legend.svelte';
    import {getPositionFromDataset} from './util';


    const worker = new Worker('algorithmMincer.worker.js');
    const steps = [];

    worker.onmessage = function (e) {
        const data = e.data[1];
        if (data.type === 'end') startVisualizingSteps();
        else processResults(data);
        nrOfSteps = steps.length;
    }

    let table;
    let fieldType = FieldType.WALL;
    let nrOfRows;
    let numberOfCells;
    let interval;
    let nrOfSteps = 0;
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
            if (steps.length === 0) clearInterval(interval);
            else {
                const step = steps.shift();
                step();
                currentStep++;
            }
        }, 50);
    }

    function highlightElement(element) {
        element.classList.add('cell--highlighted');
        setTimeout(() => element.classList.remove('cell--highlighted'), 200);
    }

    function processResults(step) {
        const element = document.getElementById(String(step.location));
        switch (step.type) {
            case 'visit': {
                steps.push(() => {
                    console.log(`visiting ${step.location}`, element);
                    highlightElement(element);
                    element.classList.add('cell--visited'); });
                break;
            }
            case 'discover': {
                steps.push(() => {
                    console.log(`discovering ${step.location}`, element);
                    highlightElement(element);
                    return element.classList.add('cell--discovered');
                });
                break;
            }
            case 'markPath': {
                steps.push(() => {
                    console.log(`discovering ${step.location}`, element);
                    highlightElement(element);
                    return element.classList.add('cell--path');
                });
            }
            break;
        }
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
        <Loader nrOfSteps={nrOfSteps} currentStep={currentStep}/>
        <Grid bind:nrOfRows={nrOfRows} bind:numberOfCells={numberOfCells} bind:table={table}
              selectedFieldType={fieldType}/>
    </div>
</main>
