import type {
  OverviewSnapshot,
  SyncRunRecord,
  SyncStepRecord,
} from "./types";

export type SeniorStepExecutor = {
  name: string;
  execute: () => Promise<unknown>;
};

export type OverviewCustomerSyncStore = {
  getActiveRun(): Promise<SyncRunRecord | null>;
  createRun(stepNames: string[]): Promise<SyncRunRecord>;
  updateStep(runId: string, step: SyncStepRecord): Promise<void>;
  completeRun(
    runId: string,
    status: "SUCCEEDED" | "FAILED",
    errorSummary?: string,
  ): Promise<SyncRunRecord>;
  reopenRun(runId: string): Promise<SyncRunRecord>;
  getRun(runId: string): Promise<SyncRunRecord | null>;
  listRuns(limit?: number): Promise<SyncRunRecord[]>;
  getServedSnapshot(): Promise<OverviewSnapshot | null>;
  getLastSuccessfulSyncAt(): Promise<Date | null>;
  publishSnapshot(
    payload: unknown,
    successAt: Date,
  ): Promise<OverviewSnapshot>;
};
