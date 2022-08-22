<style lang="scss" global>
    @import '../../scss/theme';
    .heuristics {
      display: flex;
    }

    .heuristics-picker {
        display: flex;
        flex-direction: column;
        width: 300px;
      margin-right: 20px;
    }

    .reset-icon {
        margin: 0 10px;
        font-size: 30px;
        height: 30px;
        width: 30px;
    }

    .reset-button {
        width: 100px;
        margin: 0 20px;
        height: 20px;
      padding: 0;
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
    import Button from "@smui/button"
    import Select, { Option } from "@smui/select"
    import {
        faTimes,
    } from '@fortawesome/free-solid-svg-icons';
    import Icon from 'svelte-awesome';
    const dispatch = createEventDispatcher();
    import {heuristics} from '../../store';

    const heuristicChoices = [{ value: Heuristics.MANHATTAN, name: 'Manhattan' }, { value: Heuristics.EUCLIDEAN, name: 'Euclidean' }, { value: Heuristics.CUSTOM, name: 'Custom' }];
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
    <div class="heuristics-picker" >
        <Select enhanced items={heuristicChoices} bind:value={heuristicsValue}>
            {#each heuristicChoices as heuristicChoice}
                <Option value={heuristicChoice.value} selected={heuristicsValue === heuristicChoice.value}>{heuristicChoice.name}</Option>
            {/each}
        </Select>
    {#if $heuristics.type === Heuristics.CUSTOM}
        <CustomHeuristicsPicker on:applyFormula={applyFormula} />
    {/if}
    </div>
    <Button variant="raised" on:click={onResetClick}>
        <span>Reset Grid</span>
        <Icon class="reset-icon" data={faTimes}/>
    </Button>
</div>
