<script lang="ts">
  import '../app.css';
  import { localeReady } from '../i18n';

  let { children } = $props();
</script>

{#await localeReady then}
  {@render children()}
{/await}
