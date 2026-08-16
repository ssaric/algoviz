import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cell } from '../core/cell';
import type { Step, StepKind } from '../core/protocol';
import { Timeline, type Direction } from './Timeline';

const step = (x: number, kind: StepKind = 'visit'): Step => ({
  kind,
  cell: cell(x, 0),
  g: x,
  h: 0,
  f: x,
  parent: null,
  note: `step ${x}`
});

type Applied = { x: number; direction: Direction };

function setup() {
  const applied: Applied[] = [];
  const timeline = new Timeline((s, direction) => applied.push({ x: s.cell.x, direction }));
  return { applied, timeline };
}

describe('appending', () => {
  it('starts empty and parked at zero', () => {
    const { timeline } = setup();

    expect(timeline.state).toEqual({ totalSteps: 0, cursor: 0, isPlaying: false });
  });

  it('grows the history without applying anything', () => {
    const { applied, timeline } = setup();

    timeline.append([step(0), step(1)]);

    expect(timeline.state.totalSteps).toBe(2);
    expect(timeline.state.cursor).toBe(0);
    expect(applied).toEqual([]);
  });

  it('ignores an empty batch', () => {
    const { timeline } = setup();
    const listener = vi.fn();
    timeline.subscribe(listener);
    listener.mockClear();

    timeline.append([]);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('seeking', () => {
  let ctx: ReturnType<typeof setup>;

  beforeEach(() => {
    ctx = setup();
    ctx.timeline.append([step(0), step(1), step(2), step(3)]);
  });

  it('applies each step in order when moving forward', () => {
    ctx.timeline.seek(3);

    expect(ctx.applied).toEqual([
      { x: 0, direction: 'forward' },
      { x: 1, direction: 'forward' },
      { x: 2, direction: 'forward' }
    ]);
    expect(ctx.timeline.state.cursor).toBe(3);
  });

  it('reverts in reverse order when moving backward', () => {
    ctx.timeline.seek(3);
    ctx.applied.length = 0;

    ctx.timeline.seek(1);

    expect(ctx.applied).toEqual([
      { x: 2, direction: 'backward' },
      { x: 1, direction: 'backward' }
    ]);
    expect(ctx.timeline.state.cursor).toBe(1);
  });

  it('is a no-op when the cursor does not move', () => {
    ctx.timeline.seek(2);
    ctx.applied.length = 0;

    ctx.timeline.seek(2);

    expect(ctx.applied).toEqual([]);
  });

  it('clamps to the ends of the history', () => {
    ctx.timeline.seek(999);
    expect(ctx.timeline.state.cursor).toBe(4);

    ctx.timeline.seek(-999);
    expect(ctx.timeline.state.cursor).toBe(0);
  });

  it('leaves no residue after a full round trip', () => {
    ctx.timeline.seek(4);
    ctx.timeline.seek(0);

    const forward = ctx.applied.filter((a) => a.direction === 'forward').length;
    const backward = ctx.applied.filter((a) => a.direction === 'backward').length;
    expect(forward).toBe(backward);
    expect(ctx.timeline.state.cursor).toBe(0);
  });

  it('moves by a relative amount', () => {
    ctx.timeline.stepBy(2);
    expect(ctx.timeline.state.cursor).toBe(2);

    ctx.timeline.stepBy(-1);
    expect(ctx.timeline.state.cursor).toBe(1);
  });
});

describe('the step under the playhead', () => {
  it('is the step that was most recently applied', () => {
    const { timeline } = setup();
    timeline.append([step(0), step(1), step(2)]);

    expect(timeline.stepAtCursor).toBeNull();

    timeline.seek(2);
    expect(timeline.stepAtCursor?.cell.x).toBe(1);

    timeline.seek(3);
    expect(timeline.stepAtCursor?.cell.x).toBe(2);
  });
});

describe('clearing', () => {
  it('drops the history without replaying it backwards', () => {
    const { applied, timeline } = setup();
    timeline.append([step(0), step(1)]);
    timeline.seek(2);
    applied.length = 0;

    timeline.clear();

    expect(applied).toEqual([]);
    expect(timeline.state).toEqual({ totalSteps: 0, cursor: 0, isPlaying: false });
  });
});

describe('subscribers', () => {
  it('receive the current state immediately and on every change', () => {
    const { timeline } = setup();
    const listener = vi.fn();

    const unsubscribe = timeline.subscribe(listener);
    expect(listener).toHaveBeenCalledWith({ totalSteps: 0, cursor: 0, isPlaying: false });

    timeline.append([step(0)]);
    expect(listener).toHaveBeenLastCalledWith({ totalSteps: 1, cursor: 0, isPlaying: false });

    timeline.seek(1);
    expect(listener).toHaveBeenLastCalledWith({ totalSteps: 1, cursor: 1, isPlaying: false });

    unsubscribe();
    timeline.seek(0);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
