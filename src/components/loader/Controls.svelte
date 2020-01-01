<style lang="scss" global>
    .controls__icon {
        width: 35px;
        height: 40px;
        cursor: pointer;
        font-size: 30px;
    }

    .controls {
        width: 300px;
        display: flex;
        align-items: center;
        height: 50px;
        justify-content: space-between;
    }

</style>

<script>
    import {createEventDispatcher} from 'svelte';
    import {
        faStepBackward,
        faPlay,
        faStepForward
    } from '@fortawesome/free-solid-svg-icons';
    import Icon from 'svelte-awesome';

    export let nrOfSteps;
    export let currentStep;
    const dispatch = createEventDispatcher();

    function onSkipBackwardClick() {
        dispatch('backwardClick');
    }
    function onPlayClick() {
        dispatch('playClick');
    }
    function onSkipForwardClick() {
        dispatch('forwardClick');
    }


</script>
<div class="controls">
    <div on:click={onSkipBackwardClick}>
        <Icon class="controls__icon" data={faStepBackward}/>
    </div>
    <div on:click={onPlayClick}>
        <Icon class="controls__icon" data={faPlay}/>
    </div>
    <div on:click={onSkipForwardClick}>
        <Icon class="controls__icon" data={faStepForward}/>
    </div>
</div>
