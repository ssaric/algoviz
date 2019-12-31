<script>
    import { createEventDispatcher } from 'svelte';
    import Icon from 'svelte-awesome';

    const dispatch = createEventDispatcher();

    export let selected;
    export let icon;
    export let id;
    export let text;

    function onClick() {
        dispatch('legendItemClick', {
            id,
        });
    }


</script>


<div class="legend-item" class:legend-item--selected={selected} on:click={onClick}>
    <div class="legend-item__icon">
        <Icon data={icon} />
    </div>
    <span class="legend-item__text">{text}</span>
</div>
