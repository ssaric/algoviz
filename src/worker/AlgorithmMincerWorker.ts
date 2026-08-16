import { Grid } from '../core/Grid';
import { createHeuristic } from '../core/heuristics';
import {
  STEP_BATCH_SIZE,
  type Step,
  type WorkerRequest,
  type WorkerResponse
} from '../core/protocol';
import { search } from '../core/search';

const ctx = self as unknown as Worker;

const post = (message: WorkerResponse): void => ctx.postMessage(message);

function run(request: WorkerRequest): void {
  const { runId } = request;
  post({ kind: 'started', runId });

  const grid = new Grid({
    columns: request.grid.columns,
    rows: request.grid.rows,
    start: request.grid.start,
    end: request.grid.end,
    walls: request.grid.walls
  });

  const steps = search(grid, createHeuristic(request.heuristic));
  let batch: Step[] = [];

  const flush = (): void => {
    if (batch.length === 0) return;
    post({ kind: 'steps', runId, steps: batch });
    batch = [];
  };

  for (;;) {
    const next = steps.next();
    if (next.done) {
      flush();
      post({ kind: 'finished', runId, outcome: next.value });
      return;
    }
    batch.push(next.value);
    if (batch.length >= STEP_BATCH_SIZE) flush();
  }
}

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    run(request);
  } catch (error) {
    post({
      kind: 'failed',
      runId: request.runId,
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

export {};
