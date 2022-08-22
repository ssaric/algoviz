import {Heuristics} from "./constants/types";
import {writable} from 'svelte/store';


const heuristics = writable<{ type: Heuristics, formula?: string}>({
    type: Heuristics.EUCLIDEAN,
});

export {
    heuristics,
}
