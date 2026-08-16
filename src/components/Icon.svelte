<script lang="ts">
  import { icons, type IconName } from './icons';

  type Props = {
    name: IconName;
    label?: string;
    class?: string;
  };

  let { name, label, class: className = '' }: Props = $props();

  const glyph = $derived(icons[name]);
</script>

<svg
  class={className}
  viewBox={glyph.box}
  fill="currentColor"
  aria-hidden={label ? undefined : 'true'}
  aria-label={label}
  role={label ? 'img' : undefined}
>
  <path d={glyph.d} />
</svg>
