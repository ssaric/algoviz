import type { AlgorithmId } from '../core/algorithms';
import type { SerializedGrid } from '../core/Grid';
import type { HeuristicSpec } from '../core/heuristics';
import { Painter, type BoardState } from './Painter';

export type RunnerVariant = {
  readonly algorithm: AlgorithmId;
  readonly heuristic: HeuristicSpec;
};

export type RunnerState = {
  /** The longest of the runs; the shorter board simply finishes early. */
  readonly totalSteps: number;
  readonly cursor: number;
  readonly isPlaying: boolean;
  readonly boards: readonly BoardState[];
};

export type RunnerListener = (state: RunnerState) => void;

const TARGET_PLAYBACK_SECONDS = 14;
const FRAMES_PER_SECOND = 60;

/**
 * Runs the same board under two strategies against one clock.
 *
 * Both boards advance by the same absolute step count rather than by a
 * percentage of their own run. That is the entire point: when one search needs
 * ten times the steps of the other, you should see it still grinding away long
 * after the other has stopped, not politely rescaled to finish alongside it.
 */
export class LessonRunner {
  private readonly painters: Painter[];
  private readonly boardStates: BoardState[];
  private readonly unsubscribes: (() => void)[] = [];
  private readonly listeners = new Set<RunnerListener>();
  private cursor = 0;
  private frame: number | null = null;

  constructor(
    containers: readonly HTMLElement[],
    board: SerializedGrid,
    variants: readonly RunnerVariant[]
  ) {
    this.painters = containers.map(
      (container) => new Painter(container, { board, editable: false, autoPlay: false })
    );
    this.boardStates = this.painters.map((painter) => painter.state);

    this.painters.forEach((painter, index) => {
      painter.setAlgorithm(variants[index].algorithm);
      painter.setHeuristic(variants[index].heuristic);
      this.unsubscribes.push(
        painter.subscribe((state) => {
          this.boardStates[index] = state;
          this.publish();
        })
      );
    });
  }

  get state(): RunnerState {
    return {
      totalSteps: this.totalSteps,
      cursor: this.cursor,
      isPlaying: this.frame !== null,
      boards: [...this.boardStates]
    };
  }

  private get totalSteps(): number {
    return Math.max(0, ...this.boardStates.map((board) => board.totalSteps));
  }

  subscribe(listener: RunnerListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Starts both searches from scratch and plays them through together. */
  run(): void {
    this.pause();
    this.cursor = 0;
    this.painters.forEach((painter) => painter.solve());
    this.play();
  }

  play(): void {
    if (this.frame !== null) return;
    if (this.totalSteps > 0 && this.cursor >= this.totalSteps) this.seek(0);

    const tick = () => {
      const total = this.totalSteps;
      const perFrame = Math.max(
        1,
        Math.ceil(total / (TARGET_PLAYBACK_SECONDS * FRAMES_PER_SECOND))
      );
      this.apply(this.cursor + perFrame);
      // The searches run in workers, so the last batch may still be arriving.
      if (total > 0 && this.cursor >= total && this.everyBoardSettled()) {
        this.pause();
        return;
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
    this.publish();
  }

  pause(): void {
    if (this.frame === null) return;
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.publish();
  }

  seek(cursor: number): void {
    this.pause();
    this.apply(cursor);
  }

  skip(delta: number): void {
    this.seek(this.cursor + delta);
  }

  destroy(): void {
    this.pause();
    this.unsubscribes.forEach((off) => off());
    this.painters.forEach((painter) => painter.destroy());
    this.listeners.clear();
  }

  private everyBoardSettled(): boolean {
    return this.boardStates.every((board) => board.status !== 'solving');
  }

  private apply(target: number): void {
    const next = Math.max(0, Math.min(Math.round(target), this.totalSteps));
    if (next === this.cursor) return;
    this.cursor = next;
    // Each board clamps to its own length, so a finished one simply holds.
    this.painters.forEach((painter) => painter.seek(next));
    this.publish();
  }

  private publish(): void {
    const state = this.state;
    this.listeners.forEach((listener) => listener(state));
  }
}
