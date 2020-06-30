import { writable } from 'svelte/store';
import {AlgorithmInfoMessage, CellInfoMessage, Heuristics} from "./constants/types";

const infoMessagesMap = writable({});
const heuristics = writable({
    type: Heuristics.EUCLIDEAN,
});

const addInfoMessage = (message: AlgorithmInfoMessage) => infoMessagesMap.update((oldMap: Record<string, CellInfoMessage>) => {
    const newMap = {
        ...oldMap
    };
    if (!newMap[message.tileId]) {
        newMap[message.tileId] = {
            info: [message.info],
            ghValues: message.ghValues,
            parent: message.parent
        }
    } else {
        newMap[message.tileId] = {
            info: [
                ...newMap[message.tileId].info,
                message.info
            ],
            ghValues: message.ghValues,
            parent: message.parent
        }
    }

    return newMap;
});

export {
    infoMessagesMap,
    heuristics,
    addInfoMessage,
}
