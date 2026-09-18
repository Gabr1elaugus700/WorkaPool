import type { GrpproSyncStore } from "../sync/ports";

export type GrpproSyncStatus = {
  lastSuccessfulSyncAt: Date | null;
  lastRowCount: number | null;
  activeRunId: string | null;
  lastError: string | null;
};

export class GetGrpproSyncStatusUseCase {
  constructor(private readonly store: GrpproSyncStore) {}

  async execute(): Promise<GrpproSyncStatus> {
    const [lastSuccessfulSyncAt, lastRowCount, activeRun, recentRuns] =
      await Promise.all([
        this.store.getLastSuccessfulSyncAt(),
        this.store.getLastRowCount(),
        this.store.getActiveRun(),
        this.store.listRuns(20),
      ]);

    const lastFailed = recentRuns.find((run) => run.status === "FAILED");

    return {
      lastSuccessfulSyncAt,
      lastRowCount,
      activeRunId: activeRun?.id ?? null,
      lastError: lastFailed?.error ?? null,
    };
  }
}
