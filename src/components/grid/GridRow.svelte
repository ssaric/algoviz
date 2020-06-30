<style lang="scss" global>
    @import "../../scss/theme";

    .cell {
        height: 20px;
        width: 20px;
        cursor: pointer;
        border: 1px solid $color-neutral10;
        transition: background-color 0.01s;
        position: relative;
    }

    .cell--wall {
        background-color: $color-neutral40;
    }

    .cell--start {
        cursor: grab;
        background-size: 15px 15px;
        background-repeat: no-repeat;
        background-position: center;
        background-image: url("/images/play-circle-solid.svg");
    }

    .cell--end {
        cursor: grab;
        background-size: 15px 15px;
        background-repeat: no-repeat;
        background-position: center;
        background-image: url("/images/dot-circle-solid.svg");
    }

    .cell--discovered {
        background-color: $color-primary20;
    }

    .cell--visited {
        background-color: $color-primary40;
    }

    .cell--path {
        background-color: $color-secondary50;
    }

    .cell--highlighted {
        border: 2px solid blue;
    }
    .cell--visited {
        &.gradient-0 {
            background-color: #0067E5;
        }

        &.gradient-10 {
            background-color: #0B6FDC;
        }

        &.gradient-20 {
            background-color: #1677D3;
        }

        &.gradient-30 {
            background-color: #2180CA;
        }

        &.gradient-40 {
            background-color: #2C88C1;
        }

        &.gradient-50 {
            background-color: #3890B8;
        }

        &.gradient-60 {
            background-color: #4399AF;
        }

        &.gradient-70 {
            background-color: #4EA1A6;
        }

        &.gradient-80 {
            background-color: #59A99D;
        }

        &.gradient-90 {
            background-color: #65B294;
        }
    }

</style>
<script>
    import {createEventDispatcher, onMount} from 'svelte';

    export let numberOfCells;
    export let rowIndex;
    const dispatch = createEventDispatcher();

    onMount(() => {
        dispatch('gridCreated');
    })

    function onCellClick(e) {
        dispatch('cellClick',e);
    }

</script>

<tr class="row">
    {#each Array(numberOfCells) as c, columnIndex}
        <td
                class="cell"
                on:click={onCellClick}
                id={`${rowIndex},${columnIndex}`}
                data-cell-location={`${rowIndex},${columnIndex}`}
        ></td>
    {/each}
</tr>
