import type { Cell } from '../core/cell';

/** The editing surface a pointer stroke acts on. Implemented by Painter. */
export type BoardEditor = {
  cellAt(target: EventTarget | null): Cell | null;
  isWall(c: Cell): boolean;
  isStart(c: Cell): boolean;
  isEnd(c: Cell): boolean;
  setWall(c: Cell, present: boolean): void;
  moveStart(c: Cell): void;
  moveEnd(c: Cell): void;
  /** The cell the pointer is resting on, or null when it leaves the board. */
  inspect(c: Cell | null): void;
};

type Stroke =
  { mode: 'draw' | 'erase' } | { mode: 'move-start' } | { mode: 'move-end' } | { mode: 'none' };

/**
 * Turns pointer gestures into board edits.
 *
 * Pointer events rather than mouse events so pen and touch work too. The
 * stroke's intent is decided once on pointerdown -- dragging from an empty cell
 * only ever draws, dragging from a wall only ever erases -- which stops a drag
 * from flickering cells on and off as it re-enters them.
 */
export class PointerController {
  private stroke: Stroke = { mode: 'none' };

  constructor(
    private readonly container: HTMLElement,
    private readonly editor: BoardEditor,
    /** Preset boards are read-only, but still hover to explain themselves. */
    private readonly editable = true
  ) {}

  bind(): void {
    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerleave', this.onPointerLeave);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  unbind(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.editable || event.button !== 0) return;
    const target = this.editor.cellAt(event.target);
    if (!target) return;

    event.preventDefault();
    this.editor.inspect(null);
    if (this.editor.isStart(target)) {
      this.stroke = { mode: 'move-start' };
    } else if (this.editor.isEnd(target)) {
      this.stroke = { mode: 'move-end' };
    } else {
      this.stroke = { mode: this.editor.isWall(target) ? 'erase' : 'draw' };
      this.apply(target);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const target = this.editor.cellAt(event.target);
    if (this.stroke.mode === 'none') {
      // Only report a resting pointer. Mid-stroke the user is editing the
      // board, not reading it.
      this.editor.inspect(target);
      return;
    }
    if (target) this.apply(target);
  };

  private readonly onPointerLeave = (): void => {
    this.editor.inspect(null);
  };

  private readonly onPointerUp = (): void => {
    this.stroke = { mode: 'none' };
  };

  private apply(target: Cell): void {
    switch (this.stroke.mode) {
      case 'draw':
        this.editor.setWall(target, true);
        return;
      case 'erase':
        this.editor.setWall(target, false);
        return;
      case 'move-start':
        this.editor.moveStart(target);
        return;
      case 'move-end':
        this.editor.moveEnd(target);
        return;
      case 'none':
        return;
    }
  }
}
