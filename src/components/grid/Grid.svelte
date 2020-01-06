<script>
    import MouseClick from '../../enums/MouseClick';
    import FieldType from '../../enums/FieldType';
    import GridCore from './GridCore.svelte';
    import {afterUpdate, onDestroy, onMount} from 'svelte';
    import {createEventDispatcher} from 'svelte';
    import {debounce} from '../../util';

    export let selectedFieldType;
    export let table;


    const dispatch = createEventDispatcher();

    const CELL_SIZE = 20;
    const sets = [];
    export let nrOfRows = 0;
    export let nrOfCells = 0;
    let gridHeight;
    let gridWidth;
    let selectedCells = new Map(sets);
    let dragSelect = false;
    let startNode = undefined;
    let endNode = undefined;



    for (let i = 0; i < nrOfRows; i++) {
        sets.push([`${i}`, new Set()]);
    }

    const dbAdjustNumberOfCells = debounce(adjustNumberOfCells, 250);

    function adjustNumberOfCells(e) {
        nrOfCells = Math.floor(gridWidth / CELL_SIZE);
        nrOfRows = Math.floor(gridHeight / CELL_SIZE);
    }

    onMount(() => {
        window.addEventListener('resize', dbAdjustNumberOfCells);
    })

    afterUpdate(() => {
        if (nrOfCells === 0) nrOfCells = Math.floor(gridWidth / CELL_SIZE);
        if (nrOfRows === 0) nrOfRows = Math.floor(gridHeight / CELL_SIZE);
    })

    onDestroy(() => {
        document.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('resize', dbAdjustNumberOfCells);
    });


    function resetGrid() {
        dispatch('resetGrid');
    }

    function _setCellState(fieldType, node) {
        switch (fieldType) {
            case FieldType.WALL:
                node.classList.toggle('cell--wall');
                break;
            case FieldType.START:
                node.classList.add('cell--start');
                node.classList.remove('cell--wall');
                node.classList.remove('cell--end');
                if (startNode) {
                    startNode.classList.remove('cell--start');
                }
                startNode = node;
                break;
            case FieldType.END:
                node.classList.add('cell--end');
                node.classList.remove('cell--wall');
                node.classList.remove('cell--start');
                if (endNode) {
                    endNode.classList.remove('cell--end');
                }
                endNode = node;
                break;
        }
        resetGrid();
    }

    function onMouseDown(e) {
        if (e.button !== undefined && e.button !== MouseClick.LEFT) return;
        if (selectedFieldType !== FieldType.WALL) return;
        document.addEventListener('mouseout', onMouseOut);
        document.addEventListener('touchcancel', onMouseOut);
        resetGrid();
        dragSelect = true;
    }

    function onMouseMove(e) {
        if (!dragSelect) return;
        if (selectedFieldType !== FieldType.WALL) return;
        if (!e.target.dataset.cellLocation) return;
        e.target.classList.add('cell--wall');
    }

    function onTouchMove(e) {
        const { touches } = e;
        const touch = touches[0];
        const { clientX, clientY } = touch;
        const element = document.elementFromPoint(clientX, clientY);
        if (!element.dataset.cellLocation) return;
        element.classList.add('cell--wall');
    }

    function onMouseUp() {
        if (selectedFieldType !== FieldType.WALL) return;
        document.removeEventListener('mouseout', onMouseOut);
        dragSelect = false;
    }

    function onMouseOut(e) {
        const from = e.relatedTarget;
        if (!from || from.nodeName === 'HTML') {
            dragSelect = false;
        }
    }

    function onCellClick(e) {
        if (!e.detail.target.dataset.cellLocation) return;
        if (e.detail.button !== MouseClick.LEFT) return;
        _setCellState(selectedFieldType, e.detail.target);
    }

</script>
<style lang="scss" global>
    @import '../../scss/theme.scss';

    .table {
        border-spacing: 0;
        width: 100%;
        height: calc(100% - 240px);
        user-select: none;

        &.table--start-overlay {
            .cell:hover.cell:after {
                content: "";
                height: 15px;
                width: 15px;
                display: block;
                background-size: 15px 15px;
                background-repeat: no-repeat;
                background-image: url("/images/play-circle-solid.svg");
            }
        }

        &.table--end-overlay {
            .cell:hover.cell:after {
                content: "";
                height: 15px;
                width: 15px;
                display: block;
                background-size: 15px 15px;
                background-repeat: no-repeat;
                background-image: url("/images/dot-circle-solid.svg");
            }
        }

        &.table--wall-overlay {
            .cell:hover.cell:after {
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


<table bind:this={table} class="table"
       bind:clientWidth={gridWidth} bind:clientHeight={gridHeight}
       class:table--wall-overlay={selectedFieldType === FieldType.WALL}
       class:table--start-overlay={selectedFieldType === FieldType.START}
       class:table--end-overlay={selectedFieldType === FieldType.END}
       on:touchend={onMouseUp}
       on:mouseup={onMouseUp}
       on:mousedown={onMouseDown}
       on:touchstart={onMouseDown}
       on:mousemove={onMouseMove}
       on:touchmove={onTouchMove}>
    <GridCore nrOfRows={nrOfRows}
              numberOfCells={nrOfCells}
              selectedCells={selectedCells}
              on:cellClick={onCellClick}/>
</table>
