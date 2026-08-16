<script lang="ts">
  import type { CellInspection } from '../board/Painter';

  type Props = {
    inspection: CellInspection;
  };

  let { inspection }: Props = $props();

  const SIZE = 168;

  const pull = $derived(inspection.pull);

  /** A step costs 1. Anything past that is the heuristic overpaying, so the
   *  arrow saturates rather than growing without bound. */
  const strength = $derived(Math.min(1, pull ? pull.ratio : 0));

  const length = $derived(16 + strength * 52);

  // One hue, kept clear of the board's greens, terracotta and greys so the
  // arrow never reads as another kind of cell. Depth encodes the strength.
  const tone = $derived.by(() => {
    if (!pull) return 'var(--color-vector-weak)';
    if (pull.ratio >= 1.001) return 'var(--color-vector-strong)'; // overpays
    if (pull.ratio >= 0.999) return 'var(--color-vector)'; // pays for itself
    return 'var(--color-vector-weak)'; // underpays: the search will hedge
  });

  const centreX = $derived(inspection.anchor.left + inspection.anchor.width / 2);
  const centreY = $derived(inspection.anchor.top + inspection.anchor.height / 2);
</script>

{#if pull && pull.best > 0}
  <svg
    class="pull-arrow pointer-events-none fixed z-10"
    style:left="{centreX - SIZE / 2}px"
    style:top="{centreY - SIZE / 2}px"
    width={SIZE}
    height={SIZE}
    viewBox="0 0 {SIZE} {SIZE}"
    aria-hidden="true"
  >
    <g transform="translate({SIZE / 2} {SIZE / 2}) rotate({pull.angleDeg})">
      <!-- The full length a step could buy, for the arrow to be read against. -->
      <line
        x1="0"
        y1="0"
        x2="68"
        y2="0"
        stroke={tone}
        stroke-width="2"
        stroke-dasharray="3 4"
        opacity="0.3"
      />
      <line
        x1="0"
        y1="0"
        x2={length}
        y2="0"
        stroke={tone}
        stroke-width="4"
        stroke-linecap="round"
        opacity="0.9"
      />
      <path d="M {length} 0 L {length - 9} -6 L {length - 9} 6 Z" fill={tone} opacity="0.9" />
    </g>
    <circle cx={SIZE / 2} cy={SIZE / 2} r="3.5" fill={tone} />
  </svg>
{/if}
