<script>
    import GridRow from './GridRow.svelte';
    let infoMessagesMap;
    export let nrOfRows;
    export let numberOfCells;
</script>

{#each Array(nrOfRows) as r, rowIndex}
    <GridRow
            numberOfCells={numberOfCells}
            rowIndex={rowIndex}
            on:gridCreated
            on:cellClick
    />
{/each}
