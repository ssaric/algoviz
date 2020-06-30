<style lang="scss" global>
    @import '../../scss/theme';

    .heuristics {
        display: flex;
        flex-direction: column;
        width: 550px;
    }

    .heuristics__title {
        margin-bottom: 10px;
    }

    input[type=radio] {
        position: absolute;
        visibility: hidden;
        display: none;
    }

    label {
        color: #9a929e;
        display: inline-block;
        cursor: pointer;
        font-weight: bold;
        padding: 5px 20px;
    }

    input[type=radio]:checked + label {
        color: #ccc8ce;
        background: $color-primary40;
    }

    label + input[type=radio] + label {
        border-left: solid 3px #675f6b;
    }

    .radio-group {
        border: solid 3px $color-primary30;
        display: inline-block;
        overflow: hidden;
    }

</style>
<script lang="ts">
    import { Heuristics } from '../../constants/types';
    import CustomHeuristicsPicker from './CustomHeuristicsPicker.svelte';
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    import {heuristics} from '../../store';

    let heuristicsValue = Heuristics.EUCLIDEAN;
    let formula = '';


    $: {
        heuristics.update(() => ({
            type: heuristicsValue
        }));
    }
    function applyFormula() {
        heuristics.update(() => ({ type: Heuristics.CUSTOM, formula }));
    }

</script>

<div class="heuristics">
    <span class="heuristics__title">Heuristics:</span>
    <div class="heuristics-toggle">
        <div class="radio-group">
            <input id="euclidian" type=radio bind:group={heuristicsValue} value={Heuristics.EUCLIDEAN}><label
                for="euclidian">Euclidian</label>
            <input id="manhattan" type=radio bind:group={heuristicsValue} value={Heuristics.MANHATTAN}><label
                for="manhattan">Manhattan</label>
            <input id="custom" type=radio bind:group={heuristicsValue} value={Heuristics.CUSTOM}><label for="custom">Custom</label>
        </div>
    </div>
    {#if heuristicsValue === Heuristics.CUSTOM}
        <CustomHeuristicsPicker {formula} on:applyFormula={applyFormula} />
    {/if}
</div>
