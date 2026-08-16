import { cell, type Cell } from './cell';
import type { SerializedGrid } from './Grid';

/**
 * Boards for the lessons are authored as ASCII so the layout is legible in the
 * source rather than being a list of coordinates nobody can picture.
 *
 *   `S` start   `G` goal   `#` wall   `.` or space  empty
 */
export function parseBoard(ascii: string): SerializedGrid {
  const lines = ascii.replace(/\n+$/, '').replace(/^\n+/, '').split('\n');
  if (lines.length === 0) throw new Error('Board is empty');

  const columns = Math.max(...lines.map((line) => line.length));
  const walls: Cell[] = [];
  let start: Cell | null = null;
  let end: Cell | null = null;

  lines.forEach((line, y) => {
    for (let x = 0; x < columns; x++) {
      switch (line[x]) {
        case '#':
          walls.push(cell(x, y));
          break;
        case 'S':
          if (start) throw new Error('Board has more than one start');
          start = cell(x, y);
          break;
        case 'G':
          if (end) throw new Error('Board has more than one goal');
          end = cell(x, y);
          break;
        case '.':
        case ' ':
        case undefined:
          break;
        default:
          throw new Error(`Unexpected character "${line[x]}" at ${x},${y}`);
      }
    }
  });

  if (!start) throw new Error('Board has no start');
  if (!end) throw new Error('Board has no goal');

  return { columns, rows: lines.length, start, end, walls };
}

/** Rectangular board with nothing in the way. */
export function openBoard(columns: number, rows: number, start: Cell, end: Cell): SerializedGrid {
  return { columns, rows, start, end, walls: [] };
}
