import {GridCoordinates} from "../util/GridNode";

export enum MessageType {
    GRID_DATA,
    INFO_DATA,
    ALGORITHM_STEP,
    SET_HEURISTICS,
}

export enum AlgorithmWorkerStepType {
    START,
    END,
    INFO,
    MARK_PATH,
    VISIT,
    DISCOVER
}

export enum FieldType {
    START,
    END,
    WALL,
}

export enum MouseClick {
    LEFT,
    MIDDLE,
    RIGHT,
}

export enum PlaybackDirection {
    FORWARD= "forward",
    BACKWARD = "backward"
}

export type WorkerGridTransferData = {
    width: number,
    height: number,
    start: Array<number>,
    end: Array<number>,
    walls: Array<Array<number>>,
    heuristics: HeuristicsData
}

export type GridConstructorData = {
    width: number,
    height: number,
    start: GridCoordinates,
    end: GridCoordinates,
    walls: Array<GridCoordinates>,
    heuristics: HeuristicsData
}

export type GridData = {
    walls: Array<Element>;
    startPosition: Array<Element>;
    endPosition: Array<Element>;
}

export interface StepFunction {
    (direction: PlaybackDirection): void;
}

export enum Heuristics {
    EUCLIDEAN,
    MANHATTAN,
    CUSTOM
}

export type AlgorithmStep = {
    type: AlgorithmWorkerStepType;
    location?: Array<number>;
    neighbours?: [number, number][];
    info?: string;
}

export type AlgorithmInfoMessage = {
    type: AlgorithmWorkerStepType;
    tileId: string;
    ghValues?: [number, number]
    info: string;
    parent? : string;
}

export type CellInfoMessage = {
    ghValues?: [number, number]
    info: string[];
    parent? : string;
}

export type HeuristicsData = {
    type: Heuristics;
    formula?: string;
}
