import type { GrpproRow, GrpproSyncRunRecord } from "./types";

export interface GrpproSeniorReader {
  fetchAll(): Promise<GrpproRow[]>;
}

export interface ProdutoGrupoMapWriter {
  truncateStaging(): Promise<void>;
  bulkInsertStaging(rows: GrpproRow[], syncedAt: Date): Promise<void>;
  atomicSwap(): Promise<void>;
  countProduction(): Promise<number>;
}

export interface GrpproSyncStore {
  getActiveRun(): Promise<GrpproSyncRunRecord | null>;
  createRun(): Promise<GrpproSyncRunRecord>;
  completeRun(
    runId: string,
    status: "SUCCEEDED" | "FAILED",
    params?: { rowCount?: number; error?: string },
  ): Promise<GrpproSyncRunRecord>;
  getRun(runId: string): Promise<GrpproSyncRunRecord | null>;
  listRuns(limit?: number): Promise<GrpproSyncRunRecord[]>;
  getLastSuccessfulSyncAt(): Promise<Date | null>;
  getLastRowCount(): Promise<number | null>;
  updateMetaAfterSuccess(syncedAt: Date, rowCount: number): Promise<void>;
}
