<style lang="scss" global>
    @import '../../scss/theme';

    .heuristics-toggle {
        display: flex;
        align-items: center;
    }

    .heuristics {
        display: flex;
        flex-direction: column;
        width: 750px;
    }

    .heuristics__title {
        margin-bottom: 10px;
    }

    input[type=radio] {
        position: absolute;
        visibility: hidden;
        display: none;
    }

    .reset-icon {
        margin: 0 10px;
        font-size: 30px;
        height: 30px;
        width: 30px;
    }

    .reset-button {
        display: flex;
        align-items: center;
        width: 170px;
        margin: 0 20px;
        height: 35px;
        white-space: nowrap;
        cursor: pointer;
        color: #9a929e;
        font-weight: bold;
        border: solid 3px $color-primary30;
        justify-content: space-between;
        padding: 0 20px;
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
    import {
        faTimes,
    } from '@fortawesome/free-solid-svg-icons';
    import Icon from 'svelte-awesome';
    const dispatch = createEventDispatcher();
    import {heuristics} from '../../store';

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
        heuristics.update(() => ({ type: Heuristics.CUSTOM, formula: event.detail }));
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
        <div class="reset-button" on:click={onResetClick}>
            <span>Reset Grid</span>
            <Icon class="reset-icon" data={faTimes}/>
        </div>
    </div>
    {#if heuristicsValue === Heuristics.CUSTOM}
        <CustomHeuristicsPicker on:applyFormula={applyFormula} />
    {/if}
</div>
