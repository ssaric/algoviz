<style lang="scss" global>
    @import "../../scss/theme";

    .cell {
        height: 20px;
        width: 20px;
        cursor: pointer;
        border: 1px solid $color-neutral10;
        transition: background-color 0.01s;
        position: relative;

        &:hover {
            background: $color-neutral20;
        }
    }

    .cell--wall {
        background-color: $color-neutral40;
    }

    .cell--start {
        background-size: 15px 15px;
        background-repeat: no-repeat;
        background-position: center;
        background-image: url("/images/play-circle-solid.svg");
    }

    .cell--end {
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
</style>
<script>
    import {createEventDispatcher} from 'svelte';

    export let numberOfCells;
    export let rowIndex;
    const dispatch = createEventDispatcher();

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
                data-cell-location={`${rowIndex}-${columnIndex}`}
        ></td>
    {/each}
</tr>
