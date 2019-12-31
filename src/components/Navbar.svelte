<style lang="scss" global>
    @import '../scss/theme.scss';

    .navbar {
        display: flex;
        background: $color-neutral60;
        transition: width 0.6s cubic-bezier(0.075, 0.82, 0.165, 1);
        width: 100%;
        height: 60px;
        flex-direction: row;
        justify-content: space-between;
        padding: 10px 20px;
    }

    .navbar__title {
        text-transform: uppercase;
        font-weight: bold;
        display: flex;
        align-items: center;
    }

    .navbar-button {
        width: 40px;
        height: 40px;
        cursor: pointer;
    }

    .navbar__links-wrapper {
        display: flex;
        justify-content: flex-end;
        width: 500px;
        align-items: center;
        flex-direction: row;
        margin-top: 0;
        overflow: visible;
    }

    .navbar__links-wrapper .navbar__link {
        padding-left: 0;
        justify-content: center;

    }
</style>


<nav class="navbar">
    <h6 class="navbar__title">
        Algoviz - Algorithm Visualization
    </h6>
</nav>
