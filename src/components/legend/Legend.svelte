<style lang="scss" global>
    @import '../../scss/theme';

    .legend {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 20px;
    }

    .legend-wrapper {
        display: flex;
        align-items: center;
    }

    .legend-item {
        margin-right: 25px;
        display: flex;
        align-items: center;
        padding: 8px;
        cursor: pointer;
        border: 1px solid transparent;
        user-select: none;
    }

    .legend-item--selected {
        border: 1px solid $color-neutral60;
    }

    .legend-item__icon {
        margin-right: 5px;
        font-size: 25px;
        height: 20px;
        width: 20px;
    }

    .legend__start-button {
        display: flex;
        align-items: center;
        font-size: 25px;
        .legend-item__icon {
            height: 40px;
            width: 40px;
        }
    }

</style>
<script>
    import Icon from 'svelte-awesome';
    import {
        faPlayCircle,
        faDotCircle,
        faSquareFull
    } from '@fortawesome/free-solid-svg-icons';
    import LegendItem from './LegendItem.svelte';
    import FieldType from '../../enums/FieldType';

    export let selectedFieldType;

</script>


<div class="legend">
    <div class="legend-wrapper">
        <LegendItem on:legendItemClick selected={selectedFieldType === FieldType.START} text="Start location"
                    icon={faPlayCircle} id={FieldType.START}/>
        <LegendItem on:legendItemClick selected={selectedFieldType === FieldType.END} text="End location"
                    icon={faDotCircle} id={FieldType.END}/>
        <LegendItem on:legendItemClick selected={selectedFieldType === FieldType.WALL} text="Wall" icon={faSquareFull}
                    id={FieldType.WALL}/>
    </div>
</div>
