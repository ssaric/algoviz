<style lang="scss" global>
    @import '../../scss/theme';

    .playback-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 1px solid $color-neutral40;
        position: absolute;
        bottom: 20px;
        width: 500px;
        border-radius: 10px;
        background: $color-neutral10;
        padding: 10px;
        z-index: 10;
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
        user-select: none;
    }

    .disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }

    .loader-wrapper {
        width: 100%;
        padding: 40px 20px;
        display: flex;
    }

    .loader {
        width: 100%;
        margin: 0 20px;
    }

    input[type=range] {
        -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
        width: 100%; /* Specific width is required for Firefox. */
        background: transparent; /* Otherwise white in Chrome */
    }

    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
    }

    input[type=range]:focus {
        outline: none; /* Removes the blue border. You should probably do some kind of focus styling for accessibility reasons though. */
    }

    input[type=range]::-ms-track {
        width: 100%;
        cursor: pointer;

        /* Hides the slider so custom styles can be added */
        background: transparent;
        border-color: transparent;
        color: transparent;
    }

    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        border: 1px solid #000000;
        height: 36px;
        width: 16px;
        border-radius: 3px;
        background: #ffffff;
        cursor: pointer;
        margin-top: -14px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d; /* Add cool effects to your sliders! */
    }

    /* All the same stuff for Firefox */
    input[type=range]::-moz-range-thumb {
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        border: 1px solid #000000;
        height: 36px;
        width: 16px;
        border-radius: 3px;
        background: #ffffff;
        cursor: pointer;
    }

    /* All the same stuff for IE */
    input[type=range]::-ms-thumb {
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        border: 1px solid #000000;
        height: 36px;
        width: 16px;
        border-radius: 3px;
        background: #ffffff;
        cursor: pointer;
    }

    input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 8.4px;
        cursor: pointer;
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        background: #3071a9;
        border-radius: 1.3px;
        border: 0.2px solid #010101;
    }

    input[type=range]:focus::-webkit-slider-runnable-track {
        background: #367ebd;
    }

    input[type=range]::-moz-range-track {
        width: 100%;
        height: 8.4px;
        cursor: pointer;
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        background: #3071a9;
        border-radius: 1.3px;
        border: 0.2px solid #010101;
    }

    input[type=range]::-ms-track {
        width: 100%;
        height: 8.4px;
        cursor: pointer;
        background: transparent;
        border-color: transparent;
        border-width: 16px 0;
        color: transparent;
    }

    input[type=range]::-ms-fill-lower {
        background: #2a6495;
        border: 0.2px solid #010101;
        border-radius: 2.6px;
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    }

    input[type=range]:focus::-ms-fill-lower {
        background: #3071a9;
    }

    input[type=range]::-ms-fill-upper {
        background: #3071a9;
        border: 0.2px solid #010101;
        border-radius: 2.6px;
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
    }

    input[type=range]:focus::-ms-fill-upper {
        background: #367ebd;
    }

    .drag-grip {
        cursor: grab;
        position: absolute;
        right: calc(50% - 12px);
        top: 4px;
        color: $color-neutral40;
        width: 25px;
        height: 25px;
        z-index: 11;
    }

</style>

<script>
    import {createEventDispatcher} from 'svelte';
    import Controls from './Controls.svelte';
    import { faGripHorizontal } from '@fortawesome/free-solid-svg-icons/faGripHorizontal';
    import { draggable } from 'svelte-drag';
    import Icon from "svelte-awesome";
    export let hasData;
    export let nrOfSteps;
    export let currentStep;
    const dispatch = createEventDispatcher();

    function onLoaderChange(e) {
          e.stopPropagation();
        dispatch('loaderChange', e);
    }


</script>
<div class="playback-controls" use:draggable={{ handle: '.drag-grip'}}>
    <Icon class="drag-grip"  data={faGripHorizontal}/>
    <div class="loader-wrapper" class:disabled={!hasData}>
        <span>0</span>
        <input
                type="range"
                class="loader"
                min="0"
                max={nrOfSteps - 1}
                step="1"
                on:input={onLoaderChange}
                value={currentStep}
        />
        <span>{nrOfSteps}</span>
    </div>
    <Controls on:playClick on:stopClick on:forwardClick on:backwardClick {hasData}/>
</div>
