import { apiFetchJson } from "@/lib/apiFetch";
import type {
  GrpproSyncRunResponse,
  GrpproSyncRunsResponse,
  GrpproSyncStartResult,
  GrpproSyncStatus,
} from "../types/grpproSync.types";

export const GrpproSyncService = {
  getStatus: async (): Promise<GrpproSyncStatus> => {
    return apiFetchJson<GrpproSyncStatus>("/api/grppro/sync/status");
  },

  listRuns: async (limit = 50): Promise<GrpproSyncRunsResponse> => {
    return apiFetchJson<GrpproSyncRunsResponse>(
      `/api/grppro/sync/runs?limit=${limit}`,
    );
  },

  getRun: async (runId: string): Promise<GrpproSyncRunResponse> => {
    return apiFetchJson<GrpproSyncRunResponse>(
      `/api/grppro/sync/runs/${encodeURIComponent(runId)}`,
    );
  },

  startSync: async (): Promise<GrpproSyncStartResult> => {
    return apiFetchJson<GrpproSyncStartResult>("/api/grppro/sync/runs", {
      method: "POST",
    });
  },
};
