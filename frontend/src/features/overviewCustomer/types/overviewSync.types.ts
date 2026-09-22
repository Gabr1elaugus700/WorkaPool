export type OverviewSyncRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type OverviewSyncStepStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED";

export type OverviewSyncStep = {
  name: string;
  status: OverviewSyncStepStatus;
  attemptCount: number;
  lastError?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type OverviewSyncRun = {
  id: string;
  status: OverviewSyncRunStatus;
  startedAt: string;
  finishedAt?: string;
  errorSummary?: string;
  steps: OverviewSyncStep[];
};

export type OverviewSyncStatus = {
  lastSuccessfulSyncAt: string | null;
  servedSnapshotId: string | null;
  activeRunId: string | null;
};

export type OverviewSyncRunsResponse = {
  runs: OverviewSyncRun[];
};

export type OverviewSyncRunResponse = {
  run: OverviewSyncRun;
};

export type OverviewSyncRetryResult = {
  run: OverviewSyncRun;
  published: boolean;
};

export type OverviewSyncStartResult = {
  run: OverviewSyncRun;
  published: boolean;
};
