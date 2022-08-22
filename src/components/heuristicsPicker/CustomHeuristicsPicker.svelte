<style lang="scss" global>
    @import '../../scss/theme';
    .custom-heuristics {
        display: flex;
        flex-direction: column;
    }
    .custom-heuristics__text {
      padding: 10px;
    }
</style>
<script lang="ts">
    import {createEventDispatcher, onMount} from 'svelte';
    const dispatch = createEventDispatcher();

    let formula = 'sqrt(x^2 + y^2)';
    onMount(()=> {
        dispatch('applyFormula', formula);
    })
    function apply() {
        dispatch('applyFormula', formula);
    }

</script>


<div class="custom-heuristics">
   <span class="custom-heuristics__text">Input a custom heuristics formula using the variables
            <code>x</code> and <code>y</code>
            representing respective horizontal and vertical distances.
            The formula will be parsed via <a target="_blank" href="https://mathjs.org/docs/expressions/parsing.html">math.js</a>
        </span>
    <input bind:value={formula} placeholder="formula"/>
    <button on:click={apply}>Apply</button>
</div>
