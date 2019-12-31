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
    }

</style>
<script>
    import Icon from 'svelte-awesome';
    import { faFlagCheckered,
        faPlayCircle,
        faDotCircle,
        faSquareFull } from '@fortawesome/free-solid-svg-icons';
    import { createEventDispatcher } from 'svelte';
    import LegendItem from './LegendItem.svelte';
    import FieldType from '../../enums/field-type';

    const dispatch = createEventDispatcher();

    export let selectedFieldType;

    function onStartClick() {
        dispatch('startClick');
    }
</script>


<div class="legend">
    <div class="legend-wrapper">
        <LegendItem on:legendItemClick selected={selectedFieldType === FieldType.START} text="Start location" icon={faPlayCircle} id={FieldType.START} />
        <LegendItem on:legendItemClick selected={selectedFieldType === FieldType.END} text="End location" icon={faDotCircle} id={FieldType.END} />
        <LegendItem on:legendItemClick selected={selectedFieldType === FieldType.WALL} text="Wall" icon={faSquareFull} id={FieldType.WALL} />
    </div>
    <div class="legend__start-button" on:click={onStartClick}>
        <Icon class="item__icon" data={faFlagCheckered}/>
        <span class="legend-item__text">Start</span>
    </div>
</div>
