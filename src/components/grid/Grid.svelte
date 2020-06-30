<script>
    import GridCore from './GridCore.svelte';
    import {MouseClick} from '../../constants/types'
    import GridNode, {GridCoordinates} from '../../util/GridNode';
    import {afterUpdate, onDestroy, onMount} from 'svelte';
    import {createEventDispatcher} from 'svelte';
    import {debounce, isLocationValid} from '../../util';
    import {infoMessagesMap} from '../../store';

    const dispatch = createEventDispatcher();
    const CELL_SIZE = 20;
    const sets = [];
    export let table;
    export let nrOfRows = 0;
    export let nrOfCells = 0;
    let gridHeight;
    let selectedFieldType;
    let gridWidth;
    let selectedCells = new Map(sets);
    let draggingStartCell = false;
    let draggingEndCell = false;
    let dragSelect = false;
    let startNode = undefined;
    let endNode = undefined;

    for (let i = 0; i < nrOfRows; i++) {
        sets.push([`${i}`, new Set()]);
    }

    const dbAdjustNumberOfCells = debounce(adjustNumberOfCells, 250);

    function adjustNumberOfCells() {
        nrOfCells = Math.floor(gridWidth / CELL_SIZE);
        nrOfRows = Math.floor(gridHeight / CELL_SIZE);
    }
    // TODO add gradient based on heuristics value
    function getGradientClass(cellId) {
        if (!$infoMessagesMap[cellId]) return;
        const maxHeuristicsValue = $infoMessagesMap.maxGhValues[1];
        const relativeValue = $infoMessagesMap[cellId].ghValues[1] / maxHeuristicsValue;
        const discreteValue = Math.round(relativeValue * 10) * 10;
        return `gradient-${discreteValue}`;
    }


    function isAlreadyOccupied(location) {
        const element = document.getElementById(String(location));
        if (element == null) return false;
        return element.classList.contains('cell--wall') ||
                element.classList.contains('cell--start') ||
                element.classList.contains('cell--end')
    }

    function isCellFree(location) {
        return isLocationValid(location, nrOfCells, nrOfRows) && !isAlreadyOccupied(location);
    }

    function getAdjacentNodes(gridNode) {
        const up = new GridCoordinates(gridNode.x - 1, gridNode.y);
        const bottom = new GridCoordinates(gridNode.x + 1, gridNode.y);
        const right = new GridCoordinates(gridNode.x, gridNode.y + 1);
        const left = new GridCoordinates(gridNode.x, gridNode.y - 1);
        const nodes = [];
        if (isLocationValid(up.toArray(), nrOfCells, nrOfRows)) nodes.push(new GridNode(up));
        if (isLocationValid(bottom.toArray(), nrOfCells, nrOfRows)) nodes.push(new GridNode(bottom));
        if (isLocationValid(right.toArray(), nrOfCells, nrOfRows)) nodes.push(new GridNode(right));
        if (isLocationValid(left.toArray(), nrOfCells, nrOfRows)) nodes.push(new GridNode(left));
        return nodes;
    }

    function getNeighbours(gridNode, visited) {
        const adjacentNodes = getAdjacentNodes(gridNode);
        return adjacentNodes.filter(n => !visited.has(n.id));
    }

    function nearestFreeCell(location) {
        const visited = new Set();
        const startNode = new GridNode(location);
        visited.add(startNode.id);
        let nodes = getAdjacentNodes(startNode);
        while (nodes.length > 0) {
            const neighbour = nodes.shift();
            if (isCellFree(neighbour.toArray())) return neighbour.toArray();
            visited.add(neighbour.id);
            const validNeighbours = getNeighbours(neighbour, visited);
            nodes = [...nodes, ...validNeighbours];
        }
    }

    function findNearestFreeCell(targetCell) {
        const location = targetCell.dataset.cellLocation.split(',').map(s => parseInt(s, 10));

        return nearestFreeCell(location);
    }

    onMount(() => {
        window.addEventListener('resize', dbAdjustNumberOfCells);
    })

    afterUpdate(() => {
        if (nrOfCells === 0) nrOfCells = Math.floor(gridWidth / CELL_SIZE);
        if (nrOfRows === 0) nrOfRows = Math.floor(gridHeight / CELL_SIZE);
        if (!endNode || endNode && document.getElementById(endNode.id) == undefined) {
            createEndNode();
        }
        if (!startNode || startNode && document.getElementById(startNode.id) == undefined) {
            createStartNode();
        }
    })

    onDestroy(() => {
        document.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('resize', dbAdjustNumberOfCells);
    });

    function createStartNode() {
        const startNodeRow = Math.floor(nrOfRows / 2);
        const startNodeColumn = Math.floor(nrOfCells / 8);
        startNode = document.getElementById([startNodeRow, startNodeColumn].toString());
        if (startNode) startNode.classList.add('cell--start');
    }

    function createEndNode() {
        const endNodeRow = Math.floor(nrOfRows / 2);
        const endNodeColumn = Math.floor(nrOfCells * (7 / 8));
        endNode = document.getElementById([endNodeRow, endNodeColumn].toString());
        if (endNode) endNode.classList.add('cell--end');
    }


    function onGridCreated() {
        if (!startNode) createStartNode();
        if (!endNode) createEndNode();
    }

    function resetGrid() {
        dispatch('resetGrid');
    }

    function onMouseDown(e) {
        if (e.button !== undefined && e.button !== MouseClick.LEFT) return;
        document.addEventListener('mouseout', onMouseOut);
        document.addEventListener('touchcancel', onMouseOut);
        resetGrid();
        if (e.target.classList.contains('cell--start')) draggingStartCell = true;
        else if (e.target.classList.contains('cell--end')) draggingEndCell = true;
        else dragSelect = true;
    }


    function onMouseMove(e) {
        if (!dragSelect && !draggingStartCell && !draggingEndCell) return;
        if (!e.target.dataset.cellLocation) return;
        handleMovementEvent(e.target);
    }

    function onTouchMove(e) {
        const {touches} = e;
        const touch = touches[0];
        const {clientX, clientY} = touch;
        const element = document.elementFromPoint(clientX, clientY);
        if (!element.dataset.cellLocation) return;
        handleMovementEvent(element);

    }

    function onMouseUp() {
        document.removeEventListener('mouseout', onMouseOut);
        dragSelect = false;
        draggingStartCell = false;
        draggingEndCell = false;
    }

    function onMouseOut(e) {
        const from = e.relatedTarget;
        if (!from || from.nodeName === 'HTML') {
            dragSelect = false;
        }
    }

    function handleMovementEvent(targetElement) {
        if (draggingStartCell) {
            if (startNode && startNode === targetElement) return;
            startNode.classList.remove('cell--start');
            startNode = targetElement;
            startNode.classList.add('cell--start');
        } else if (draggingEndCell) {
            if (endNode && endNode === targetElement) return;
            endNode.classList.remove('cell--end');
            endNode = targetElement;
            endNode.classList.add('cell--end');
        }
        if (dragSelect) {
            if (targetElement.classList.contains('cell--start')) {
                const location = findNearestFreeCell(targetElement);
                startNode = document.getElementById(String(location));
                startNode.classList.add('cell--start');
                targetElement.classList.remove('cell--start');
            } else if (targetElement.classList.contains('cell--end')) {
                const location = findNearestFreeCell(targetElement);
                endNode = document.getElementById(String(location));
                endNode.classList.add('cell--end');
                targetElement.classList.remove('cell--end');
            }
            targetElement.classList.add('cell--wall');
        }
    }

    function onCellClick(e) {
        if (!e.detail.target.dataset.cellLocation) return;
        if (e.detail.button !== MouseClick.LEFT) return;
        e.detail.target.classList.toggle('cell--wall');
    }


</script>
<style lang="scss" global>
    @import '../../scss/theme.scss';

    .table {
        border-spacing: 0;
        width: 100%;
        height: calc(100% - 240px);
        user-select: none;

        &.table--wall-overlay {
            td:not(.cell--start):not(.cell--end):hover.cell:after {
                content: "";
                height: 15px;
                width: 15px;
                display: block;
                background-size: 15px 15px;
                background-repeat: no-repeat;
                background-image: url("/images/square-full-solid.svg");
            }
        }
    }
</style>


<table bind:this={table} class="table table--wall-overlay"
       bind:clientWidth={gridWidth} bind:clientHeight={gridHeight}
       on:touchend={onMouseUp}
       on:mouseup={onMouseUp}
       on:mousedown={onMouseDown}
       on:touchstart={onMouseDown}
       on:mousemove={onMouseMove}
       on:touchmove={onTouchMove}>
    <GridCore nrOfRows={nrOfRows}
              numberOfCells={nrOfCells}
              selectedCells={selectedCells}
              on:cellClick={onCellClick}
              on:gridCreated={onGridCreated}
    />
</table>
