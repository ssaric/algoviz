<script>
    import GridRow from './GridRow.svelte';
    export let nrOfRows;
    export let numberOfCells;

    const rows = [];
    for (let i = 0; i < nrOfRows; i++) {
        rows.push(i);
    }
</script>

{#each rows as rowIndex}
    <GridRow
            numberOfCells={numberOfCells}
            rowIndex={rowIndex}
            on:cellClick
    />
{/each}
