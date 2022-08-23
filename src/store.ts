import {GridPaintStroke, Heuristics} from "./constants/types";
import {get, Writable, writable} from 'svelte/store';


const heuristics = writable<{ type: Heuristics, formula?: string}>({
    type: Heuristics.EUCLIDEAN,
});

const steps: Writable<Array<GridPaintStroke>> = writable([]);
const currentStep = writable(0);
const interval = writable<number | null>(null);

function removeInterval() {
    const currentInterval = get(interval);
    currentInterval && clearInterval(currentInterval);
    interval.set(null);
}


export {
    heuristics,
    steps,
    currentStep,
    interval,
    removeInterval,
}
