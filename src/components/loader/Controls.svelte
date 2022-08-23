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
        > div {
            display: flex;
            justify-content: center;
        }
    }

</style>

<script>
    import {createEventDispatcher} from 'svelte';
    import { faStepBackward } from '@fortawesome/free-solid-svg-icons/faStepBackward';
    import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
    import { faStop } from '@fortawesome/free-solid-svg-icons/faStop';
    import { faStepForward } from '@fortawesome/free-solid-svg-icons/faStepForward';
    import Icon from 'svelte-awesome';
    import { interval } from "../../store.ts";

    let isPlaying;
    $: {
          isPlaying = $interval !== null;
    }

    export let hasData;
    const dispatch = createEventDispatcher();

    function onSkipBackwardClick() {
        dispatch('backwardClick');
    }
    function onPlayClick() {
        dispatch('playClick');
    }
    function onStopClick() {
        dispatch('stopClick');
    }
    function onSkipForwardClick() {
        dispatch('forwardClick');
    }


</script>
<div class="controls">
    <div on:click={onSkipBackwardClick} class:disabled={!hasData}>
        <Icon class="controls__icon" data={faStepBackward}/>
    </div>
    <div on:click={onPlayClick}>
        <Icon class="controls__icon" data={faPlay}/>
    </div>
    <div on:click={onStopClick} class:disabled={!isPlaying}>
        <Icon class="controls__icon" data={faStop}/>
    </div>
    <div on:click={onSkipForwardClick} class:disabled={!hasData}>
        <Icon class="controls__icon" data={faStepForward}/>
    </div>
</div>
