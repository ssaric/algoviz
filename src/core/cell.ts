/** A single square on the board. Plain data so it survives postMessage. */
export type Cell = { readonly x: number; readonly y: number };

/** Stable key for use in Set/Map lookups. */
export type CellId = string;

export const cell = (x: number, y: number): Cell => ({ x, y });

export const cellId = (c: Cell): CellId => `${c.x},${c.y}`;

export const cellsEqual = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;
