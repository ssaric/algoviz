<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import Icon from './Icon.svelte';

  const links = [
    { href: resolve('/'), label: 'Learn' },
    { href: resolve('/sandbox'), label: 'Sandbox' }
  ];

  const current = $derived(page.url.pathname.replace(/\/$/, '') || '/');
</script>

<nav class="navbar">
  <div class="navbar__title-wrapper">
    <img alt="njanjo-logo" src="/logo.svg" class="navbar-button" />
    <h6 class="navbar__title">Algoviz</h6>
    <div class="navbar__nav">
      {#each links as link (link.href)}
        <a
          href={link.href}
          class="navbar__nav-link"
          class:navbar__nav-link--active={current === link.href}
          aria-current={current === link.href ? 'page' : undefined}
        >
          {link.label}
        </a>
      {/each}
    </div>
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
    align-items: center;
  }

  .navbar__nav {
    display: flex;
    gap: 4px;
    margin-left: 28px;
  }

  .navbar__nav-link {
    padding: 6px 14px;
    border-radius: 999px;
    color: $color-neutral20;
    text-decoration: none;
    font-size: $font-size-body2;

    &:hover {
      color: $color-neutral5;
      background: rgba(255, 255, 255, 0.08);
    }

    &--active {
      color: $color-neutral70;
      background: $color-neutral5;
    }
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
