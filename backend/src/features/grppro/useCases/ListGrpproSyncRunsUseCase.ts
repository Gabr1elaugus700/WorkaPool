import type { GrpproSyncStore } from "../sync/ports";
import type { GrpproSyncRunRecord } from "../sync/types";

export class ListGrpproSyncRunsUseCase {
  constructor(private readonly store: GrpproSyncStore) {}

  async execute(limit = 50): Promise<GrpproSyncRunRecord[]> {
    return this.store.listRuns(limit);
  }
}
