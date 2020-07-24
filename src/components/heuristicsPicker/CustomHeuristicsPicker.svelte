<style lang="scss" global>
    @import '../../scss/theme';
    .custom-heuristics {
        display: flex;
        flex-direction: column;
    }
</style>
<script lang="ts">
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    let formula = '';

    function apply() {
        dispatch('applyFormula', formula);
    }

</script>


<div class="custom-heuristics">
   <span>Input a custom heuristics formula using the variables
            <code>x</code> and <code>y</code>
            representing respective horizontal and vertical distances.
            The formula will be parsed via <a target="_blank" href="https://mathjs.org/docs/expressions/parsing.html">math.js</a>
        </span>
    <input bind:value={formula} placeholder="formula"/>
    <button on:click={apply}>Apply</button>
</div>
