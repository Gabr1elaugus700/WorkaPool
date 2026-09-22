import type { OverviewCustomerSyncStore } from "../../src/features/overviewCustomer/sync/ports";
import type {
  OverviewSnapshot,
  SyncRunRecord,
  SyncStepRecord,
} from "../../src/features/overviewCustomer/sync/types";

let runSeq = 0;
let snapshotSeq = 0;

export class InMemoryOverviewCustomerSyncStore
  implements OverviewCustomerSyncStore
{
  private readonly runs = new Map<string, SyncRunRecord>();
  private servedSnapshot: OverviewSnapshot | null = null;
  private lastSuccessfulSyncAt: Date | null = null;

  seedSuccessfulSnapshot(
    snapshot: OverviewSnapshot,
    lastSuccessfulSyncAt: Date,
  ): void {
    this.servedSnapshot = snapshot;
    this.lastSuccessfulSyncAt = lastSuccessfulSyncAt;
  }

  async getActiveRun(): Promise<SyncRunRecord | null> {
    for (const run of this.runs.values()) {
      if (run.status === "RUNNING") {
        return this.cloneRun(run);
      }
    }
    return null;
  }

  async createRun(stepNames: string[]): Promise<SyncRunRecord> {
    runSeq += 1;
    const run: SyncRunRecord = {
      id: `run-${runSeq}`,
      status: "RUNNING",
      startedAt: new Date(),
      steps: stepNames.map((name) => ({
        name,
        status: "PENDING",
        attemptCount: 0,
      })),
    };
    this.runs.set(run.id, run);
    return this.cloneRun(run);
  }

  async updateStep(runId: string, step: SyncStepRecord): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Sync run ${runId} not found`);
    }
    const index = run.steps.findIndex((s) => s.name === step.name);
    if (index < 0) {
      throw new Error(`Sync step ${step.name} not found on run ${runId}`);
    }
    run.steps[index] = { ...step };
  }

  async completeRun(
    runId: string,
    status: "SUCCEEDED" | "FAILED",
    errorSummary?: string,
  ): Promise<SyncRunRecord> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Sync run ${runId} not found`);
    }
    run.status = status;
    run.finishedAt = new Date();
    if (errorSummary !== undefined) {
      run.errorSummary = errorSummary;
    }
    return this.cloneRun(run);
  }

  async reopenRun(runId: string): Promise<SyncRunRecord> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Sync run ${runId} not found`);
    }
    run.status = "RUNNING";
    run.finishedAt = undefined;
    run.errorSummary = undefined;
    return this.cloneRun(run);
  }

  async getRun(runId: string): Promise<SyncRunRecord | null> {
    const run = this.runs.get(runId);
    return run ? this.cloneRun(run) : null;
  }

  async listRuns(limit = 50): Promise<SyncRunRecord[]> {
    const runs = Array.from(this.runs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
    return runs.map((run) => this.cloneRun(run));
  }

  async getServedSnapshot(): Promise<OverviewSnapshot | null> {
    return this.servedSnapshot
      ? { ...this.servedSnapshot, payload: this.servedSnapshot.payload }
      : null;
  }

  async getLastSuccessfulSyncAt(): Promise<Date | null> {
    return this.lastSuccessfulSyncAt;
  }

  async publishSnapshot(
    payload: unknown,
    successAt: Date,
  ): Promise<OverviewSnapshot> {
    snapshotSeq += 1;
    const snapshot: OverviewSnapshot = {
      id: `snap-${snapshotSeq}`,
      publishedAt: successAt,
      payload,
    };
    this.servedSnapshot = snapshot;
    this.lastSuccessfulSyncAt = successAt;
    return { ...snapshot };
  }

  private cloneRun(run: SyncRunRecord): SyncRunRecord {
    return {
      ...run,
      steps: run.steps.map((step) => ({ ...step })),
    };
  }
}
