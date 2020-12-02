<style lang="scss" global>
    @import "../../scss/theme";

    .info-bubble {
        position: fixed;
        flex-direction: column;
        background: white;
        display: none;
        z-index: 1;

        &.visible {
            display: flex;
        }
    }
</style>
<script>

    export let mousePosition;
    export let content = {};
    $: hasContent = content && Object.keys(content).length > 0;

</script>
<div class="info-bubble" class:visible={true}
     style="left: {mousePosition && mousePosition[0]}px; top: {mousePosition && mousePosition[1]}px">
    {#if hasContent}
        {#each Array(content.info) as c, columnIndex}
            <span
                    class="info-bubble__row"
            >{c}</span>
        {/each}
    {/if}
</div>
