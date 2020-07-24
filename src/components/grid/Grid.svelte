<script lang="ts">
    import GridCore from './GridCore.svelte';
    import {MouseClick} from '../../constants/types'
    import GridNode, {GridCoordinates} from '../../util/GridNode';
    import {afterUpdate, onDestroy, onMount} from 'svelte';
    import {createEventDispatcher} from 'svelte';
    import {debounce, isLocationValid} from '../../util';
    import {gridStart, gridEnd, gridWalls, gridSize, infoMessagesMap, setInitialGridState, updateGridStartEnd} from '../../store';

    const dispatch = createEventDispatcher();
    const CELL_SIZE = 20;
    const sets = [];
    export let table;
    const { nrOfRows, nrOfColumns } = $gridSize;
    console.log($gridSize);
    let gridHeight;
    let selectedFieldType;
    let gridWidth;
    let selectedCells = new Map(sets);
    let draggingStartCell = false;
    let draggingEndCell = false;
    let dragSelect = false;

    for (let i = 0; i < nrOfRows; i++) {
        sets.push([`${i}`, new Set()]);
    }

    const dbAdjustNumberOfCells = debounce(adjustNumberOfCells, 250);

    onMount(() => {
        window.addEventListener('resize', dbAdjustNumberOfCells);
    })

    afterUpdate(() => {
        if (nrOfColumns === 0) $gridSize.nrOfColumns = Math.floor(gridWidth / CELL_SIZE);
        if (nrOfRows === 0) $gridSize.nrOfRows = Math.floor(gridHeight / CELL_SIZE);
        updateGridStartEnd();
    })

    onDestroy(() => {
        document.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('resize', dbAdjustNumberOfCells);
    });

    function adjustNumberOfCells() {
        $gridSize.nrOfColumns = Math.floor(gridWidth / CELL_SIZE);
        $gridSize.nrOfRows = Math.floor(gridHeight / CELL_SIZE);
    }
    // TODO add gradient based on heuristics value
    function getGradientClass(cellId) {
        if (!$infoMessagesMap[cellId]) return;
        const maxHeuristicsValue = $infoMessagesMap.maxGhValues[1];
        const relativeValue = $infoMessagesMap[cellId].ghValues[1] / maxHeuristicsValue;
        const discreteValue = Math.round(relativeValue * 10) * 10;
        return `gradient-${discreteValue}`;
    }


    function isAlreadyOccupied(location: [number, number]) {
        const element = document.getElementById(String(location));
        if (element == null) return false;
        return element.classList.contains('cell--wall') ||
                element.classList.contains('cell--start') ||
                element.classList.contains('cell--end')
    }

    function isCellFree(location) {
        return isLocationValid(location, nrOfColumns, nrOfRows) && !isAlreadyOccupied(location);
    }

    function getAdjacentNodes(gridCoordinates: GridCoordinates) {
        const up = new GridCoordinates(gridCoordinates.x - 1, gridCoordinates.y);
        const bottom = new GridCoordinates(gridCoordinates.x + 1, gridCoordinates.y);
        const right = new GridCoordinates(gridCoordinates.x, gridCoordinates.y + 1);
        const left = new GridCoordinates(gridCoordinates.x, gridCoordinates.y - 1);
        const nodes = [];
        if (isLocationValid(up.toArray(), nrOfColumns, nrOfRows)) nodes.push(new GridNode(up));
        if (isLocationValid(bottom.toArray(), nrOfColumns, nrOfRows)) nodes.push(new GridNode(bottom));
        if (isLocationValid(right.toArray(), nrOfColumns, nrOfRows)) nodes.push(new GridNode(right));
        if (isLocationValid(left.toArray(), nrOfColumns, nrOfRows)) nodes.push(new GridNode(left));
        return nodes;
    }

    function getNeighbours(gridNode: GridNode, visited: Set<string>) {
        const adjacentNodes = getAdjacentNodes(gridNode.coordinates);
        return adjacentNodes.filter(n => !visited.has(n.id));
    }

    function nearestFreeCell(location) {
        const visited = new Set<string>();
        const startNode = new GridNode(new GridCoordinates(location[0], location[1]));
        visited.add(startNode.id);
        let nodes: GridNode[] = getAdjacentNodes(startNode.coordinates);
        while (nodes.length > 0) {
            const neighbour = nodes.shift();
            if (isCellFree(neighbour.toArray())) return neighbour.toArray();
            visited.add(neighbour.id);
            const validNeighbours = getNeighbours(neighbour, visited);
            nodes = [...nodes, ...validNeighbours];
        }
    }

    function findNearestFreeCell(targetCell: HTMLElement) {
        const location = targetCell.dataset.cellLocation.split(',').map(s => parseInt(s, 10));
        return nearestFreeCell(location);
    }

    function resetGrid() {
        dispatch('resetGrid');
    }

    function onGridCreated() {
        setInitialGridState();
    }

    function onMouseDown(e) {
        if (e.button !== undefined && e.button !== MouseClick.LEFT) return;
        document.addEventListener('mouseout', onMouseOut);
        document.addEventListener('touchcancel', onMouseOut);
        if (e.target.classList.contains('cell--start')) draggingStartCell = true;
        else if (e.target.classList.contains('cell--end')) draggingEndCell = true;
        else dragSelect = true;
    }


    function onMouseMove(e: MouseEvent) {
        if (!dragSelect && !draggingStartCell && !draggingEndCell) return;
        const target  = e.target as HTMLElement;
        if (!target.dataset.cellLocation) return;
        handleMovementEvent(e.target);
    }

    function onTouchMove(e) {
        const {touches} = e;
        const touch = touches[0];
        const {clientX, clientY} = touch;
        const element = document.elementFromPoint(clientX, clientY) as HTMLElement;
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
            gridStart.set(targetElement);
        } else if (draggingEndCell) {
            gridEnd.set(targetElement);
        }
        if (dragSelect) {
            if (gridStart.equals(targetElement)) {
                const newLocation = findNearestFreeCell(targetElement);
                gridStart.set(document.getElementById(String(newLocation)));
            } else if (gridEnd.equals(targetElement)) {
                const newLocation = findNearestFreeCell(targetElement);
                gridEnd.set(document.getElementById(String(newLocation)));
            }
            gridWalls.add(targetElement);
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
    <GridCore selectedCells={selectedCells}
              on:cellClick={onCellClick}
              on:gridCreated={onGridCreated}
    />
</table>
