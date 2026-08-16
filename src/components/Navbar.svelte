<script lang="ts">
  import Icon from './Icon.svelte';
</script>

<nav class="navbar">
  <div class="navbar__title-wrapper">
    <img alt="njanjo-logo" src="/logo.svg" class="navbar-button" />
    <h6 class="navbar__title">Algoviz</h6>
  </div>
  <div class="navbar__links-wrapper">
    <a
      class="btn-primary"
      href="https://github.com/ssaric/algoviz"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name="github" label="View source on GitHub" />
    </a>
  </div>
</nav>

<style lang="scss">
  @use '../scss/theme' as *;

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

    .btn-primary {
      padding-left: 0;
      justify-content: center;

      :global(svg) {
        color: white;
        width: 40px;
        height: 40px;
        transition: all 0.2s cubic-bezier(0.02, 0.01, 0.47, 1);
      }

      &:hover :global(svg) {
        color: $color-primary30;
      }
    }
  }
</style>
