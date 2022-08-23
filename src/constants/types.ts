import type { GridCoordinates } from "../painter/GridNode";

export const CELL_SIZE = 20;

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
  DISCOVER,
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
  FORWARD = "forward",
  BACKWARD = "backward",
}

export type WorkerGridTransferData = {
  columns: number;
  rows: number;
  start: Array<number>;
  end: Array<number>;
  walls: Array<Array<number>>;
  heuristics: HeuristicsData;
};

export type GridConstructorData = {
  columns: number;
  rows: number;
  start?: GridCoordinates;
  end?: GridCoordinates;
  walls?: Array<GridCoordinates>;
  heuristics?: HeuristicsData;
};

export type GridData = {
  walls: Array<Element>;
  startPosition: Array<Element>;
  endPosition: Array<Element>;
};

export type GridPaintStroke = (direction: PlaybackDirection) => void;


export enum Heuristics {
  EUCLIDEAN = "0",
  MANHATTAN = "1",
  CUSTOM = "2",
}

export type AlgorithmStep = {
  type: AlgorithmWorkerStepType;
  location?: Array<number>;
  neighbours?: [number, number][];
  info?: string;
};

export type AlgorithmInfoMessage = {
  type: AlgorithmWorkerStepType;
  tileId: string;
  ghValues?: [number, number];
  info: string;
  parent?: string;
};

export type CellInfoMessage = {
  ghValues?: [number, number];
  info: string[];
  parent?: string;
};

export type HeuristicsData = {
  type: Heuristics.EUCLIDEAN | Heuristics.MANHATTAN;
} | {
  type: Heuristics.CUSTOM;
  formula: string;
}
