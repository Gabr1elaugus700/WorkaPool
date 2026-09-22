import type { OverviewCustomerSyncStore } from "../sync/ports";

export type OverviewSyncStatus = {
  lastSuccessfulSyncAt: Date | null;
  servedSnapshotId: string | null;
  activeRunId: string | null;
};

export class GetOverviewSyncStatusUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(): Promise<OverviewSyncStatus> {
    const [lastSuccessfulSyncAt, snapshot, activeRun] = await Promise.all([
      this.store.getLastSuccessfulSyncAt(),
      this.store.getServedSnapshot(),
      this.store.getActiveRun(),
    ]);

    return {
      lastSuccessfulSyncAt,
      servedSnapshotId: snapshot?.id ?? null,
      activeRunId: activeRun?.id ?? null,
    };
  }
}
