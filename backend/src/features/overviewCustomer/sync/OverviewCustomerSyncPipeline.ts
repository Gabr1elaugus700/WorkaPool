import { AppError } from "../../../utils/AppError";
import type {
  OverviewCustomerSyncStore,
  SeniorStepExecutor,
} from "./ports";
import type { SyncRunResult, SyncStepRecord } from "./types";

const DEFAULT_MAX_ATTEMPTS = 3;

type OverviewCustomerSyncPipelineOptions = {
  maxAttempts?: number;
  now?: () => Date;
};

export class OverviewCustomerSyncPipeline {
  private readonly maxAttempts: number;
  private readonly now: () => Date;

  constructor(
    private readonly store: OverviewCustomerSyncStore,
    private readonly steps: SeniorStepExecutor[],
    options: OverviewCustomerSyncPipelineOptions = {},
  ) {
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.now = options.now ?? (() => new Date());
  }

  async run(): Promise<SyncRunResult> {
    const active = await this.store.getActiveRun();
    if (active) {
      throw new AppError({
        message: "Overview sync already has an active run",
        statusCode: 409,
        code: "OVERVIEW_SYNC_ALREADY_RUNNING",
      });
    }

    const run = await this.store.createRun(this.steps.map((step) => step.name));
    const stepResults: Record<string, unknown> = {};

    for (const executor of this.steps) {
      const outcome = await this.executeStepWithRetry(run.id, executor);
      if (outcome.status === "FAILED") {
        const failedRun = await this.store.completeRun(
          run.id,
          "FAILED",
          `Step ${executor.name} failed: ${outcome.lastError ?? "unknown"}`,
        );
        return { run: failedRun, published: false };
      }
      stepResults[executor.name] = outcome.result;
    }

    return this.publishSuccessfulRun(run.id, stepResults);
  }

  async retryFailedStep(
    runId: string,
    stepName: string,
  ): Promise<SyncRunResult> {
    const run = await this.store.getRun(runId);
    if (!run) {
      throw new AppError({
        message: `Overview sync run ${runId} not found`,
        statusCode: 404,
        code: "OVERVIEW_SYNC_RUN_NOT_FOUND",
      });
    }

    const stepRecord = run.steps.find((step) => step.name === stepName);
    if (!stepRecord || stepRecord.status !== "FAILED") {
      throw new AppError({
        message: `Overview sync step ${stepName} is not failed on run ${runId}`,
        statusCode: 400,
        code: "OVERVIEW_SYNC_STEP_NOT_FAILED",
      });
    }

    const active = await this.store.getActiveRun();
    if (active && active.id !== runId) {
      throw new AppError({
        message: "Overview sync already has an active run",
        statusCode: 409,
        code: "OVERVIEW_SYNC_ALREADY_RUNNING",
      });
    }

    await this.store.reopenRun(runId);

    const executor = this.steps.find((step) => step.name === stepName);
    if (!executor) {
      throw new AppError({
        message: `Overview sync step executor ${stepName} is not registered`,
        statusCode: 400,
        code: "OVERVIEW_SYNC_STEP_NOT_FAILED",
      });
    }

    const outcome = await this.executeStepWithRetry(runId, executor);
    if (outcome.status === "FAILED") {
      const failedRun = await this.store.completeRun(
        runId,
        "FAILED",
        `Step ${stepName} failed: ${outcome.lastError ?? "unknown"}`,
      );
      return { run: failedRun, published: false };
    }

    const stepResults: Record<string, unknown> = {
      [stepName]: outcome.result,
    };

    const failedIndex = this.steps.findIndex((step) => step.name === stepName);
    for (let i = failedIndex + 1; i < this.steps.length; i += 1) {
      const nextExecutor = this.steps[i];
      const current = await this.store.getRun(runId);
      const nextRecord = current?.steps.find(
        (step) => step.name === nextExecutor.name,
      );
      if (nextRecord?.status === "SUCCEEDED") {
        continue;
      }

      const nextOutcome = await this.executeStepWithRetry(runId, nextExecutor);
      if (nextOutcome.status === "FAILED") {
        const failedRun = await this.store.completeRun(
          runId,
          "FAILED",
          `Step ${nextExecutor.name} failed: ${nextOutcome.lastError ?? "unknown"}`,
        );
        return { run: failedRun, published: false };
      }
      stepResults[nextExecutor.name] = nextOutcome.result;
    }

    return this.publishSuccessfulRun(runId, stepResults);
  }

  private async executeStepWithRetry(
    runId: string,
    executor: SeniorStepExecutor,
  ): Promise<
    | { status: "SUCCEEDED"; result: unknown }
    | { status: "FAILED"; lastError: string }
  > {
    let attemptCount = 0;
    let lastError: string | undefined;
    let startedAt = this.now();

    while (attemptCount < this.maxAttempts) {
      attemptCount += 1;
      startedAt = this.now();
      const running: SyncStepRecord = {
        name: executor.name,
        status: "RUNNING",
        attemptCount,
        startedAt,
        lastError: undefined,
      };
      await this.store.updateStep(runId, running);

      try {
        const result = await executor.execute();
        const succeeded: SyncStepRecord = {
          name: executor.name,
          status: "SUCCEEDED",
          attemptCount,
          startedAt,
          finishedAt: this.now(),
        };
        await this.store.updateStep(runId, succeeded);
        return { status: "SUCCEEDED", result };
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : String(error);
        const failedAttempt: SyncStepRecord = {
          name: executor.name,
          status: "RUNNING",
          attemptCount,
          startedAt,
          lastError,
        };
        await this.store.updateStep(runId, failedAttempt);
      }
    }

    const failed: SyncStepRecord = {
      name: executor.name,
      status: "FAILED",
      attemptCount,
      startedAt,
      lastError,
      finishedAt: this.now(),
    };
    await this.store.updateStep(runId, failed);
    return { status: "FAILED", lastError: lastError ?? "unknown" };
  }

  private async publishSuccessfulRun(
    runId: string,
    stepResults: Record<string, unknown>,
  ): Promise<SyncRunResult> {
    const successAt = this.now();
    await this.store.publishSnapshot(stepResults, successAt);
    const succeededRun = await this.store.completeRun(runId, "SUCCEEDED");
    return { run: succeededRun, published: true };
  }
}
