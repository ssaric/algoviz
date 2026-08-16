<script lang="ts">
  import type { CellInspection } from '../board/Painter';

  type Props = {
    inspection: CellInspection;
  };

  let { inspection }: Props = $props();

  const SIZE = 168;
  const WIN_LENGTH = 52;
  const MIN_LENGTH = 14;

  const pull = $derived(inspection.pull);

  // Fixed screen angles matching the grid's own directions (y grows down) --
  // the same four the tooltip's breakdown grid lists. This is that same data,
  // drawn on the board instead of only tabulated in the popup.
  const ANGLE_DEG: Record<string, number> = { right: 0, down: 90, left: 180, up: 270 };

  const vectors = $derived.by(() => {
    if (!pull) return [];
    return pull.directions.map((direction) => {
      const strength = -direction.deltaH; // positive = towards the goal
      const isWinner = direction.deltaH === -pull.best;
      const length = isWinner
        ? WIN_LENGTH
        : MIN_LENGTH + Math.max(0, strength / (pull.best || 1)) * (WIN_LENGTH - MIN_LENGTH) * 0.55;
      return { name: direction.name, angle: ANGLE_DEG[direction.name], length, isWinner };
    });
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
    <!-- Muted directions first, so the winner's stroke and arrowhead always
         sit on top where two vectors happen to overlap. -->
    {#each vectors.filter((v) => !v.isWinner) as vector (vector.name)}
      <g transform="translate({SIZE / 2} {SIZE / 2}) rotate({vector.angle})">
        <line
          x1="0"
          y1="0"
          x2={vector.length}
          y2="0"
          stroke="var(--color-ink-subtle)"
          stroke-width="2"
          stroke-linecap="round"
          opacity="0.55"
        />
        <path
          d="M {vector.length} 0 L {vector.length - 6} -4 L {vector.length - 6} 4 Z"
          fill="var(--color-ink-subtle)"
          opacity="0.55"
        />
      </g>
    {/each}

    {#each vectors.filter((v) => v.isWinner) as vector (vector.name)}
      <g transform="translate({SIZE / 2} {SIZE / 2}) rotate({vector.angle})">
        <line
          x1="0"
          y1="0"
          x2={vector.length}
          y2="0"
          stroke="var(--color-vector)"
          stroke-width="4"
          stroke-linecap="round"
        />
        <path
          d="M {vector.length} 0 L {vector.length - 9} -6 L {vector.length - 9} 6 Z"
          fill="var(--color-vector)"
        />
      </g>
    {/each}

    <circle cx={SIZE / 2} cy={SIZE / 2} r="3.5" fill="var(--color-vector)" />
  </svg>
{/if}
