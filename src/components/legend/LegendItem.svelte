<script>
    import {createEventDispatcher} from 'svelte';
    import Icon from 'svelte-awesome';

    const dispatch = createEventDispatcher();

    export let selected;
    export let icon;
    export let id;
    export let text;

    function onClick() {
        dispatch('legendItemClick', {
            id
        });
    }


</script>


<div class="legend-item" class:legend-item--selected={selected} on:click={onClick}>
    <Icon class="legend-item__icon" data={icon}/>
    <span class="legend-item__text">{text}</span>
</div>
