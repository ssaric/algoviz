import type { Step } from '../core/protocol';

export type Direction = 'forward' | 'backward';

export type ApplyStep = (step: Step, direction: Direction) => void;

export type TimelineState = {
  readonly totalSteps: number;
  /** How many steps are currently applied; ranges from 0 to totalSteps. */
  readonly cursor: number;
  readonly isPlaying: boolean;
};

export type TimelineListener = (state: TimelineState) => void;

/**
 * Roughly how long a full playback should take. A fixed one-step-per-frame
 * rate is fine for a short search but leaves a long one crawling for minutes,
 * so the rate scales with the length of the history instead.
 */
const TARGET_PLAYBACK_SECONDS = 12;
const FRAMES_PER_SECOND = 60;

/**
 * The seekable history of a search.
 *
 * Every step knows how to be undone, so moving the cursor is just applying or
 * reverting the difference. Holds no DOM of its own -- the caller injects how a
 * step is drawn -- which keeps playback logic testable on its own.
 */
export class Timeline {
  private steps: Step[] = [];
  private _cursor = 0;
  private frame: number | null = null;
  private readonly listeners = new Set<TimelineListener>();

  constructor(private readonly applyStep: ApplyStep) {}

  get state(): TimelineState {
    return { totalSteps: this.steps.length, cursor: this._cursor, isPlaying: this.frame !== null };
  }

  get stepAtCursor(): Step | null {
    return this._cursor > 0 ? (this.steps[this._cursor - 1] ?? null) : null;
  }

  private get stepsPerFrame(): number {
    const frames = TARGET_PLAYBACK_SECONDS * FRAMES_PER_SECOND;
    return Math.max(1, Math.ceil(this.steps.length / frames));
  }

  /** Svelte's store contract, implemented structurally so this file stays
   *  framework-free while `$timeline` still works in a component. */
  subscribe(listener: TimelineListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  append(incoming: readonly Step[]): void {
    if (incoming.length === 0) return;
    this.steps.push(...incoming);
    this.notify();
  }

  clear(): void {
    this.pause();
    this.steps = [];
    this._cursor = 0;
    this.notify();
  }

  /** Rewinds every applied step, leaving the history in place. */
  rewind(): void {
    this.seek(0);
  }

  seek(target: number): void {
    const next = Math.max(0, Math.min(Math.round(target), this.steps.length));
    if (next === this._cursor) return;

    if (next > this._cursor) {
      for (let i = this._cursor; i < next; i++) this.applyStep(this.steps[i], 'forward');
    } else {
      for (let i = this._cursor - 1; i >= next; i--) this.applyStep(this.steps[i], 'backward');
    }
    this._cursor = next;
    this.notify();
  }

  stepBy(delta: number): void {
    this.seek(this._cursor + delta);
  }

  play(): void {
    if (this.frame !== null || this.steps.length === 0) return;
    // Pressing play at the end replays from the top rather than doing nothing.
    if (this._cursor >= this.steps.length) this.seek(0);

    const tick = () => {
      // Recomputed every frame: playback usually starts while the worker is
      // still streaming, so the final length is not known up front.
      this.seek(this._cursor + this.stepsPerFrame);
      if (this._cursor >= this.steps.length) {
        this.pause();
        return;
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
    this.notify();
  }

  pause(): void {
    if (this.frame === null) return;
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.notify();
  }

  private notify(): void {
    const state = this.state;
    this.listeners.forEach((listener) => listener(state));
  }
}
