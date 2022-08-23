<style lang="scss" global>
    @import "../scss/index";

    .root-container {
        flex-grow: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    #root{
        height: 100%;
        width: 100%;
    }

    .home {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-direction: column;
        height: calc(100% - 60px);
        background: $color-neutral5;
    }

</style>

<script lang="ts">
    import PlaybackControls from '../components/loader/PlaybackControls.svelte';
    import Navbar from '../components/Navbar.svelte';
    import Legend from "../components/legend/Legend.svelte";
    import Painter from "../painter/Painter";
    import {onDestroy, onMount} from "svelte";
    import {steps} from "../store";
    import {currentStep} from "../store.js";

    let painter: Painter;


    let hasData;
    let nrOfSteps;

    $: {
        hasData = $steps.length > 0;
        nrOfSteps = $steps.length;
    }

    onDestroy(() => {
        painter?.unbindEventHandlers();
        painter?.algorithmWorker?.terminate();
    });
    onMount(async () => {
        painter  = new Painter();
        painter?.bindEventHandlers();
        painter?.loadWorker();
    });




</script>

<main class="root-container">
    <Navbar/>
    <div class="home">
        <Legend on:resetGrid={painter?.resetGrid} />
        <PlaybackControls
                hasData={hasData}
                on:playClick={painter?.startVisualizingSteps}
                on:stopClick={painter?.stopPlaying}
                on:backwardClick={painter?.skipBackward}
                on:forwardClick={painter?.skipForward}
                on:loaderChange={painter?.onManualLoaderChange}
                nrOfSteps={nrOfSteps}
                currentStep={$currentStep}/>
        <div id="root"></div>
    </div>
</main>
