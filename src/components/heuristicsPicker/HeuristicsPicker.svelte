<style lang="scss" global>
    @import '../../scss/theme';

    .heuristics {
        display: flex;
        align-items: center;
    }

    .button-wrapper {
        height: 40px;
    }

    .heuristics-picker {
        display: flex;
        flex-direction: column;
        width: 300px;
        margin-right: 20px;
        select {
            margin: 0;
        }
    }

    .reset-icon {
        margin: 0 10px;
        height: 20px;
        width: 20px;
    }

    .reset-button {
        width: 50px;
        margin: 0 20px;
        height: 30px;
    }


</style>
<script lang="ts">
    import {Heuristics} from '../../constants/types';
    import CustomHeuristicsPicker from './CustomHeuristicsPicker.svelte';
    import {createEventDispatcher} from 'svelte';
    import {Select, Button} from 'flowbite-svelte';
    import {
        faTimes,
    } from '@fortawesome/free-solid-svg-icons';
    import Icon from 'svelte-awesome';

    const dispatch = createEventDispatcher();
    import {heuristics} from '../../store';

    const heuristicChoices = [{value: Heuristics.MANHATTAN, name: 'Manhattan'}, {
        value: Heuristics.EUCLIDEAN,
        name: 'Euclidean'
    }, {value: Heuristics.CUSTOM, name: 'Custom'}];
    let heuristicsValue = Heuristics.EUCLIDEAN;

    function onResetClick(e) {
        dispatch('resetGrid', e);
    }

    $: {
        heuristics.update(() => ({
            type: heuristicsValue
        }));
    }

    function applyFormula(event) {
        heuristics.update(() => ({type: Heuristics.CUSTOM, formula: event.detail}));
    }

</script>

<div class="heuristics">
    <div class="heuristics-picker">
        <Select class="mt-2" items={heuristicChoices} bind:value={heuristicsValue}/>
        {#if $heuristics.type === Heuristics.CUSTOM}
            <CustomHeuristicsPicker on:applyFormula={applyFormula}/>
        {/if}
    </div>
    <div class="button-wrapper">
    <Button size="sm" color="red" on:click={onResetClick}>
        <Icon  class="reset-icon" data={faTimes}/>
        <span>Reset Grid</span>
    </Button>
    </div>
</div>
