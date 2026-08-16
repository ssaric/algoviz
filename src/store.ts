import { Heuristics, type GridPaintStroke } from './constants/types';
import { get, writable, type Writable } from 'svelte/store';

const heuristics = writable<{ type: Heuristics; formula?: string }>({
  type: Heuristics.EUCLIDEAN
});

const steps: Writable<Array<GridPaintStroke>> = writable([]);
const currentStep = writable(0);
const interval = writable<number | null>(null);

function removeInterval() {
  const currentInterval = get(interval);
  if (currentInterval !== null) clearInterval(currentInterval);
  interval.set(null);
}

export { heuristics, steps, currentStep, interval, removeInterval };
