export type SyncRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export type SyncStepStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export type SyncStepRecord = {
  name: string;
  status: SyncStepStatus;
  attemptCount: number;
  lastError?: string;
  startedAt?: Date;
  finishedAt?: Date;
};

export type SyncRunRecord = {
  id: string;
  status: SyncRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  errorSummary?: string;
  steps: SyncStepRecord[];
};

export type OverviewSnapshot = {
  id: string;
  publishedAt: Date;
  payload: unknown;
};

export type SyncRunResult = {
  run: SyncRunRecord;
  published: boolean;
};
