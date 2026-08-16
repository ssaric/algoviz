import type { AlgorithmId } from '../core/algorithms';
import type { SerializedGrid } from '../core/Grid';
import type { HeuristicSpec } from '../core/heuristics';
import type { SearchOutcome, Step, WorkerRequest, WorkerResponse } from '../core/protocol';

export type WorkerClientHandlers = {
  onStarted: (runId: number) => void;
  onSteps: (steps: readonly Step[]) => void;
  onFinished: (outcome: SearchOutcome) => void;
  onFailed: (message: string) => void;
};

/**
 * Typed wrapper around the search worker.
 *
 * Every request is stamped with a run id and every response carries it back.
 * Responses from a superseded run are dropped here, so callers never have to
 * reason about a reset that lands while an earlier search is still streaming.
 */
export class WorkerClient {
  private worker: Worker | null = null;
  private nextRunId = 1;
  private activeRunId = 0;

  constructor(private readonly handlers: WorkerClientHandlers) {}

  /** Starts a search and returns its run id. Any run in flight is abandoned. */
  solve(grid: SerializedGrid, algorithm: AlgorithmId, heuristic: HeuristicSpec): number {
    const runId = this.nextRunId++;
    this.activeRunId = runId;

    const request: WorkerRequest = { kind: 'solve', runId, grid, algorithm, heuristic };
    this.ensureWorker().postMessage(request);
    return runId;
  }

  /** Abandons the current run. In-flight responses for it are ignored. */
  abandon(): void {
    this.activeRunId = 0;
  }

  destroy(): void {
    this.activeRunId = 0;
    this.worker?.terminate();
    this.worker = null;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    const worker = new Worker(new URL('../worker/AlgorithmMincerWorker.ts', import.meta.url), {
      type: 'module'
    });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.receive(event.data);
    worker.onerror = (event) => {
      if (this.activeRunId !== 0) this.handlers.onFailed(event.message || 'Search worker crashed');
    };
    this.worker = worker;
    return worker;
  }

  private receive(response: WorkerResponse): void {
    if (response.runId !== this.activeRunId) return;

    switch (response.kind) {
      case 'started':
        this.handlers.onStarted(response.runId);
        return;
      case 'steps':
        this.handlers.onSteps(response.steps);
        return;
      case 'finished':
        this.activeRunId = 0;
        this.handlers.onFinished(response.outcome);
        return;
      case 'failed':
        this.activeRunId = 0;
        this.handlers.onFailed(response.message);
        return;
    }
  }
}
