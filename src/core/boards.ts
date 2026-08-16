import { cell } from './cell';
import type { SerializedGrid } from './Grid';
import { openBoard, parseBoard } from './board';

/** Nothing in the way, start and goal set diagonally apart. Straight-line and
 *  step-counting heuristics only disagree when the offset is not axis-aligned,
 *  so the diagonal is where the difference between them shows up at all. */
export const OPEN_DIAGONAL: SerializedGrid = openBoard(33, 19, cell(2, 16), cell(30, 2));

/** Same board, start and goal on one row: here every heuristic agrees. */
export const OPEN_STRAIGHT: SerializedGrid = openBoard(33, 19, cell(2, 9), cell(30, 9));

/**
 * Small and open, for the two lessons that introduce the frontier itself.
 *
 * Kept deliberately compact: a first look at "what is on the frontier right
 * now" needs to stay legible one step at a time, which a 260-cell board with
 * hundreds of steps does not. No walls, so nothing distracts from the one
 * thing changing between the two lessons that share it -- the algorithm.
 */
export const FRONTIER_DEMO: SerializedGrid = openBoard(13, 8, cell(1, 6), cell(11, 1));

/**
 * A corridor that hugs the goal's row while snaking up and down, plus an open
 * bypass above it.
 *
 * The corridor is roughly twice as long as the bypass, but every cell in it
 * sits closer to the goal than any cell on the bypass. A search that steers by
 * "what looks closest" is pulled straight into it; one that also counts the
 * cost of getting there is not. This is the board where greedy best-first --
 * and any heuristic that overestimates hard enough to act like it -- comes back
 * with a path that is not the shortest.
 */
export function combTrap(): SerializedGrid {
  const columns = 25;
  const rows = 17;
  const walls: string[][] = [];

  for (let y = 0; y < rows; y++) {
    walls.push(new Array(columns).fill('.'));
  }
  const setWall = (x: number, y: number) => (walls[y][x] = '#');

  // Border.
  for (let x = 0; x < columns; x++) {
    setWall(x, 0);
    setWall(x, rows - 1);
  }
  for (let y = 0; y < rows; y++) {
    setWall(0, y);
    setWall(columns - 1, y);
  }

  // Seal the corridor off from the open space above and below it, leaving the
  // columns at each end as the only ways in and out.
  for (let x = 2; x <= columns - 3; x++) {
    setWall(x, 5);
    setWall(x, 11);
  }

  // Teeth, alternately hanging from the top and standing on the floor, so
  // crossing the corridor costs four vertical moves for every two columns.
  for (let x = 3; x <= columns - 4; x += 2) {
    const fromTop = ((x - 3) / 2) % 2 === 0;
    for (let y = fromTop ? 6 : 7; y <= (fromTop ? 9 : 10); y++) setWall(x, y);
  }

  const ascii = walls.map((row) => row.join(''));
  ascii[8] = replaceAt(ascii[8], 1, 'S');
  ascii[8] = replaceAt(ascii[8], columns - 2, 'G');

  return parseBoard(ascii.join('\n'));
}

const replaceAt = (text: string, index: number, char: string): string =>
  text.slice(0, index) + char + text.slice(index + 1);
