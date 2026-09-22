import type { OverviewCustomerSyncStore } from "../sync/ports";
import type { SyncRunRecord } from "../sync/types";

export class ListOverviewSyncRunsUseCase {
  constructor(private readonly store: OverviewCustomerSyncStore) {}

  async execute(limit = 50): Promise<SyncRunRecord[]> {
    return this.store.listRuns(limit);
  }
}
