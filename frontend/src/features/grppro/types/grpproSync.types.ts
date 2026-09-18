export type GrpproSyncRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export type GrpproSyncRun = {
  id: string;
  status: GrpproSyncRunStatus;
  startedAt: string;
  finishedAt?: string;
  rowCount?: number;
  error?: string;
};

export type GrpproSyncStatus = {
  lastSuccessfulSyncAt: string | null;
  lastRowCount: number | null;
  activeRunId: string | null;
  lastError: string | null;
};

export type GrpproSyncRunsResponse = {
  runs: GrpproSyncRun[];
};

export type GrpproSyncRunResponse = {
  run: GrpproSyncRun;
};

export type GrpproSyncStartResult = {
  run: GrpproSyncRun;
  published: boolean;
  rowCount?: number;
};
