import type { GrpproSyncStore } from "../../src/features/grppro/sync/ports";
import type { GrpproSyncRunRecord } from "../../src/features/grppro/sync/types";

export class InMemoryGrpproSyncStore implements GrpproSyncStore {
  private runs = new Map<string, GrpproSyncRunRecord>();
  private runCounter = 0;
  private lastSuccessfulSyncAt: Date | null = null;
  private lastRowCount: number | null = null;

  async getActiveRun(): Promise<GrpproSyncRunRecord | null> {
    for (const run of this.runs.values()) {
      if (run.status === "RUNNING") {
        return run;
      }
    }
    return null;
  }

  async createRun(): Promise<GrpproSyncRunRecord> {
    this.runCounter += 1;
    const run: GrpproSyncRunRecord = {
      id: `run-${this.runCounter}`,
      status: "RUNNING",
      startedAt: new Date(),
    };
    this.runs.set(run.id, run);
    return run;
  }

  async completeRun(
    runId: string,
    status: "SUCCEEDED" | "FAILED",
    params?: { rowCount?: number; error?: string },
  ): Promise<GrpproSyncRunRecord> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }
    const updated: GrpproSyncRunRecord = {
      ...run,
      status,
      finishedAt: new Date(),
      rowCount: params?.rowCount,
      error: params?.error,
    };
    this.runs.set(runId, updated);
    return updated;
  }

  async getRun(runId: string): Promise<GrpproSyncRunRecord | null> {
    return this.runs.get(runId) ?? null;
  }

  async listRuns(limit = 50): Promise<GrpproSyncRunRecord[]> {
    return [...this.runs.values()]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  async getLastSuccessfulSyncAt(): Promise<Date | null> {
    return this.lastSuccessfulSyncAt;
  }

  async getLastRowCount(): Promise<number | null> {
    return this.lastRowCount;
  }

  async updateMetaAfterSuccess(syncedAt: Date, rowCount: number): Promise<void> {
    this.lastSuccessfulSyncAt = syncedAt;
    this.lastRowCount = rowCount;
  }
}
