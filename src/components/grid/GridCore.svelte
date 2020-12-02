<script>
    import {gridSize} from '../../store';
    import GridRow from './GridRow.svelte';
    let infoMessagesMap;
</script>

{#each Array($gridSize.nrOfRows) as r, rowIndex}
    <GridRow
            rowIndex={rowIndex}
            on:gridCreated
            on:cellClick
    />
{/each}
