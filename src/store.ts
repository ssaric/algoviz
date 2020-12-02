import {AlgorithmInfoMessage, CellInfoMessage, Heuristics} from "./constants/types";
import {writable, get} from 'svelte/store';
import {getPositionFromDataset} from "./util";

const STORAGE_KEY = 'algoviz-grid-data';

const infoMessagesMap = writable({});
const heuristics = writable<{ type: Heuristics, formula?: string}>({
    type: Heuristics.EUCLIDEAN,
});

interface PersistedData {
    walls: string[],
    start: string | undefined,
    end: string | undefined,
}

const gridSize = writable({
    nrOfRows: 0,
    nrOfColumns: 0,
});

function getPersistedData(): PersistedData {
    const storedDataStringified = localStorage.getItem(STORAGE_KEY);

    let storedData;
    try {
        storedData = JSON.parse(storedDataStringified) || {};
    } catch (e) {
        storedData = {};
    }
    return storedData;
}

function createStartNode() {
    const {nrOfColumns, nrOfRows} = get(gridSize);
    const startNodeRow = Math.floor(nrOfRows / 2);
    const startNodeColumn = Math.floor(nrOfColumns / 8);
    return document.getElementById([startNodeRow, startNodeColumn].toString());
}

function createEndNode() {
    const {nrOfColumns, nrOfRows} = get(gridSize);
    const endNodeRow = Math.floor(nrOfRows / 2);
    const endNodeColumn = Math.floor(nrOfColumns * (7 / 8));
    return document.getElementById([endNodeRow, endNodeColumn].toString());
}


function convertToGridData(persistedData: PersistedData, document: Document) {
    const initialState = {
        walls: undefined,
        start: undefined,
        end: undefined,
    };
    if (persistedData.walls !== undefined) {
        initialState.walls = new Set(persistedData.walls.map(cellId => document.getElementById(cellId)));
    }
    if (persistedData.start !== undefined) {
        initialState.start = document.getElementById(persistedData.start);
    }
    if (persistedData.end !== undefined) {
        initialState.end = document.getElementById(persistedData.end);
    }

    return initialState;
}


function parseStartNode(oldPosition, newPosition) {
    if (oldPosition && oldPosition === newPosition) return oldPosition;
    oldPosition && oldPosition.classList.remove('cell--start');
    newPosition && newPosition.classList.add('cell--start');
    return newPosition;
}

const gridStart = (() => {
    const gridStartStore = writable(undefined);
    return {
        set: (newPosition: Element) =>
            gridStartStore.update((oldPosition: Element) => parseStartNode(oldPosition, newPosition)),
        reset: () => gridStart.set(createStartNode()),
        get: () => get(gridStartStore),
        equals: (targetNode) => targetNode === get(gridStartStore),
        subscribe: gridStartStore.subscribe,

    }
})();

function parseEndNode(oldPosition, newPosition) {
    if (oldPosition && oldPosition === newPosition) return oldPosition;
    oldPosition && oldPosition.classList.remove('cell--end');
    newPosition && newPosition.classList.add('cell--end');
    return newPosition;
}

const gridEnd = (() => {
    const gridEndStore = writable(undefined);
    return {
        set: (newPosition: Element) =>
            gridEndStore.update((oldPosition: Element) => parseEndNode(oldPosition, newPosition)),
        get: () => get(gridEndStore),
        reset: () => gridEnd.set(createEndNode()),
        equals: (targetNode) => targetNode === get(gridEndStore),
        subscribe: gridEndStore.subscribe,
    }
})();

const gridWalls = (() => {
    const gridWallsStore = writable(undefined);
    return {
        add: gridCell =>
            gridWallsStore.update(existingWalls => {
                gridCell.classList.add('cell--wall');
                existingWalls.add(gridCell);
                return existingWalls;
            }),
        remove: gridCell =>
            gridWallsStore.update(existingWalls => {
                gridCell.classList.remove('cell--wall');
                existingWalls.delete(gridCell);
                return existingWalls;
            }),
        set: gridWalls => gridWallsStore.set(new Set([...gridWalls].filter(w => w !== null).map((w: HTMLElement) => {
            w.classList.add('cell--wall');
            return w;
        }))),
        reset: () => {
            const currentWalls = get(gridWallsStore);
            [...currentWalls].forEach((gc: HTMLElement) => gc.classList.remove('cell--wall'));
            gridWallsStore.set(new Set());
        },
        get: () => get(gridWallsStore),
        subscribe: gridWallsStore.subscribe,
    }
})();


function setInitialGridState() {
    if (gridStart.get() && gridEnd.get()) return;
    const INITIAL_STATE = convertToGridData(getPersistedData(), document);
    if (!INITIAL_STATE.start) {
        INITIAL_STATE.start = createStartNode();
    }
    if (!INITIAL_STATE.end) {
        INITIAL_STATE.end = createEndNode();
    }
    if (!INITIAL_STATE.walls) {
        INITIAL_STATE.walls = [];
    }
    console.log(INITIAL_STATE);
    gridWalls.set(INITIAL_STATE.walls);
    gridStart.set(INITIAL_STATE.start);
    gridEnd.set(INITIAL_STATE.end);
}

function updateGridStartEnd() {
    const isStartDefined = gridStart.get() != undefined;
    const isEndDefined = gridEnd.get() != undefined;
    const isStartOutsideGrid = isStartDefined && document.getElementById(gridStart.get().id) == undefined;
    const isEndOutsideGrid = isEndDefined && document.getElementById(gridEnd.get().id) == undefined;
    if (!isStartDefined || isStartOutsideGrid)
        gridStart.set(createStartNode());
    if (!isEndDefined || isEndOutsideGrid)
        gridEnd.set(createEndNode());
}

gridWalls.subscribe(value => {
    const persistedData = getPersistedData();
    if (!value) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...persistedData,
        walls: [...value].map((gridCell: HTMLElement) => gridCell.id),
    }));
})

gridStart.subscribe((value: HTMLElement) => {
    const persistedData = getPersistedData();
    if (!value) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...persistedData,
        start: value && value.id,
    }));
})

gridEnd.subscribe((value: HTMLElement) => {
    const persistedData = getPersistedData();
    if (!value) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...persistedData,
        end: value && value.id,
    }));
})

const getGridData = () => ({
    walls: [...gridWalls.get()].map(getPositionFromDataset),
    start: getPositionFromDataset(gridStart.get()),
    end: getPositionFromDataset(gridEnd.get()),
});

const resetGridData = () => {
    gridWalls.reset();
    gridStart.reset();
    gridEnd.reset();
}

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
    gridStart,
    gridEnd,
    gridWalls,
    gridSize,
    getGridData,
    addInfoMessage,
    resetGridData,
    setInitialGridState,
    updateGridStartEnd,
}
