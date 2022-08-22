<style lang="scss" global>
    @import '../../scss/theme';

    .legend {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 20px;
    }

    .legend-wrapper {
        display: flex;
        align-items: center;
        flex: 1;
    }

    .legend-item {
        margin-right: 25px;
        display: flex;
        align-items: center;
        padding: 8px;
        cursor: pointer;
        border: 1px solid transparent;
        user-select: none;
    }

    .legend-item--selected {
        border: 1px solid $color-neutral60;
    }

    .legend-item__icon {
        margin-right: 5px;
        font-size: 25px;
        height: 20px;
        width: 20px;
    }

    .legend__start-button {
        display: flex;
        align-items: center;
        font-size: 25px;
        .legend-item__icon {
            height: 40px;
            width: 40px;
        }
    }
    .visited-fields {
        display: flex;
        justify-content: flex-end;
        flex: 1;
    }
    .visited-field {
        display: flex;
        align-items: center;
        margin-right: 30px;
    }

    .visited-field__icon {
        height: 20px;
        width: 20px;
        border: 1px solid black;
        margin-right: 8px;
    }
    .visited-field__icon--visited {
        background: $color-primary40;
    }
    .visited-field__icon--discovered {
        background: $color-primary20;

    }
    .visited-field__icon--final-path {
        background: $color-secondary50;

    }


</style>
<script>
    import HeuristicsPicker from '../heuristicsPicker/HeuristicsPicker.svelte';

</script>


<div class="legend">
    <HeuristicsPicker on:resetGrid/>
    <div class="legend-wrapper">
        <div class="visited-fields">
            <div class="visited-field">
                <div class="visited-field__icon visited-field__icon--visited" />
                <span class="visited-field__text">Visited</span>
            </div>
            <div class="visited-field">
                <div class="visited-field__icon visited-field__icon--discovered" />
                <span class="visited-field__text">Discovered</span>
            </div>
            <div class="visited-field">
                <div class="visited-field__icon visited-field__icon--final-path" />
                <span class="visited-field__text">Final path</span>
            </div>
        </div>
    </div>
</div>
