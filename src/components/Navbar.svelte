<style lang="scss" global>
    @import '../scss/theme.scss';

    .navbar {
        display: flex;
        background: $color-neutral60;
        transition: width 0.6s cubic-bezier(0.075, 0.82, 0.165, 1);
        width: 100%;
        height: 60px;
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
        margin-right: 10px;
    }

    .navbar__title-wrapper {
        display: flex;
    }

    .navbar__links-wrapper {
        display: flex;
        justify-content: flex-end;
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
<script>
    import logo from '../../public/images/logo.svg';
    import {
        faGithub,
    } from '@fortawesome/free-brands-svg-icons';
    import Icon from 'svelte-awesome';

</script>


<nav class="navbar">
    <div class="navbar__title-wrapper">
        <div class="navbar-button">
            {@html logo}
        </div>
        <h6 class="navbar__title">
            Algoviz
        </h6>
    </div>
    <div class="navbar__links-wrapper">
        <a class="btn-primary" href="https://github.com/ssaric/algoviz" target="_blank" rel="noopener noreferrer">
            <Icon class="btn__icon" data={faGithub} />
        </a>
    </div>
</nav>
