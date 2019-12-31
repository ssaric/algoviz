<script>
    import MouseClick from '../../enums/mouse-click';
    import FieldType from '../../enums/field-type';
    import GridCore from './GridCore.svelte';
    import {afterUpdate, onDestroy} from 'svelte';

    export let selectedFieldType;
    export let table;

    const CELL_SIZE = 20;
    const sets = [];
    export let nrOfRows = 40;
    export let numberOfCells = 0;
    let gridWidth;
    let selectedCells = new Map(sets);
    let dragSelect = false;
    let startNode = undefined;
    let endNode = undefined;

    for (let i = 0; i < nrOfRows; i++) {
        sets.push([`${i}`, new Set()]);
    }

    afterUpdate(() => {
        numberOfCells = Math.floor(gridWidth / CELL_SIZE);
    });

    onDestroy(() => {
        document.removeEventListener('mouseout', onMouseOut);
    });

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
    }

    function onMouseDown(e) {
        if (e.button !== MouseClick.LEFT) return;
        if (selectedFieldType !== FieldType.WALL) return;
        document.addEventListener('mouseout', onMouseOut);
        dragSelect = true;
    }

    function onMouseMove(e) {
        if (!dragSelect) return;
        if (selectedFieldType !== FieldType.WALL) return;
        if (!e.target.dataset.cellLocation) return;
        e.target.classList.add('cell--wall');
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
        height: 100%;
        width: 100%;
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


<table bind:this={table} class="table" bind:clientWidth={gridWidth}
       class:table--wall-overlay={selectedFieldType === FieldType.WALL}
       class:table--start-overlay={selectedFieldType === FieldType.START}
       class:table--end-overlay={selectedFieldType === FieldType.END}
       on:mouseup={onMouseUp}
       on:mousedown={onMouseDown}
       on:mousemove={onMouseMove}>
    <GridCore nrOfRows={nrOfRows} numberOfCells={numberOfCells} selectedCells={selectedCells}
              on:cellClick={onCellClick}/>
</table>
