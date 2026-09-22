export type GrpproSyncRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export type GrpproRow = {
  grupoCodigo: string;
  grupoDescricao: string;
  produtoCodigo: string;
};

export type GrpproSyncRunRecord = {
  id: string;
  status: GrpproSyncRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  rowCount?: number;
  error?: string;
};

export type GrpproSyncRunResult = {
  run: GrpproSyncRunRecord;
  published: boolean;
  rowCount?: number;
};
