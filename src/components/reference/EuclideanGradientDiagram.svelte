<script lang="ts">
  /**
   * The one worked example the Euclidean reference page walks through in
   * prose (an 8-short-on-x, 2-short-on-y offset), drawn as a right triangle.
   * Static and single-use on purpose -- this illustrates one specific,
   * already-verified example (see heuristics.test.ts's pull numbers), not a
   * general-purpose vector renderer like PullArrow.
   */
</script>

<figure class="mx-auto my-6 max-w-[420px]">
  <svg
    viewBox="0 0 400 210"
    role="img"
    aria-label="Right triangle showing an 8-cell horizontal gap and a 2-cell vertical gap, with the straight-line hypotenuse between them, and two arrows showing how much each direction shortens that hypotenuse."
  >
    <defs>
      <marker
        id="arrow-strong"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--color-vector)" />
      </marker>
      <marker
        id="arrow-weak"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--color-ink-subtle)" />
      </marker>
    </defs>

    <!-- The two legs -->
    <line
      x1="70"
      y1="160"
      x2="310"
      y2="160"
      stroke="var(--color-ink-subtle)"
      stroke-width="1.5"
      stroke-dasharray="4 4"
    />
    <line
      x1="310"
      y1="160"
      x2="310"
      y2="100"
      stroke="var(--color-ink-subtle)"
      stroke-width="1.5"
      stroke-dasharray="4 4"
    />

    <!-- The hypotenuse: the actual straight-line h -->
    <line x1="70" y1="160" x2="310" y2="100" stroke="var(--color-ink)" stroke-width="2" />

    <!-- Strong pull: shortening the 8-cell gap -->
    <line
      x1="70"
      y1="160"
      x2="132"
      y2="160"
      stroke="var(--color-vector)"
      stroke-width="3"
      marker-end="url(#arrow-strong)"
    />
    <!-- Weak pull: shortening the 2-cell gap -->
    <line
      x1="70"
      y1="160"
      x2="70"
      y2="140"
      stroke="var(--color-ink-subtle)"
      stroke-width="1.5"
      marker-end="url(#arrow-weak)"
    />

    <!-- Points -->
    <circle cx="70" cy="160" r="4" fill="var(--color-ink)" />
    <circle cx="310" cy="100" r="4" fill="var(--color-brand)" />

    <!-- Labels -->
    <text x="190" y="178" text-anchor="middle" class="fill-ink-subtle text-[11px]">&#916;x = 8</text
    >
    <text x="322" y="133" class="fill-ink-subtle text-[11px]">&#916;y = 2</text>
    <text x="175" y="122" text-anchor="middle" class="fill-ink text-[11px] font-medium"
      >h &#8776; 8.25</text
    >
    <text x="100" y="176" class="fill-vector text-[11px] font-semibold">&minus;0.97</text>
    <text x="14" y="138" class="fill-ink-subtle text-[11px]">&minus;0.18</text>
    <text x="55" y="180" class="fill-ink-subtle text-[10px]">here</text>
    <text x="300" y="90" class="fill-brand text-[10px] font-medium">goal</text>
  </svg>
  <figcaption class="text-ink-subtle mt-1 text-center text-xs italic">
    Same right triangle Euclidean is measuring. Shortening the long leg (left, thick) collapses the
    hypotenuse by 0.97; shortening the short leg (up, thin) barely moves it, by 0.18.
  </figcaption>
</figure>

<style>
  .fill-ink {
    fill: var(--color-ink);
  }
  .fill-ink-subtle {
    fill: var(--color-ink-subtle);
  }
  .fill-vector {
    fill: var(--color-vector);
  }
  .fill-brand {
    fill: var(--color-brand);
  }
</style>
