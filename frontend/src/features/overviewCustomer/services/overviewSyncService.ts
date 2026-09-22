import { apiFetchJson } from "@/lib/apiFetch";
import type {
  OverviewSyncRetryResult,
  OverviewSyncRunResponse,
  OverviewSyncRunsResponse,
  OverviewSyncStartResult,
  OverviewSyncStatus,
} from "../types/overviewSync.types";

export const OverviewSyncService = {
  getStatus: async (): Promise<OverviewSyncStatus> => {
    return apiFetchJson<OverviewSyncStatus>("/api/overview/sync/status");
  },

  listRuns: async (limit = 50): Promise<OverviewSyncRunsResponse> => {
    return apiFetchJson<OverviewSyncRunsResponse>(
      `/api/overview/sync/runs?limit=${limit}`,
    );
  },

  getRun: async (runId: string): Promise<OverviewSyncRunResponse> => {
    return apiFetchJson<OverviewSyncRunResponse>(
      `/api/overview/sync/runs/${encodeURIComponent(runId)}`,
    );
  },

  retryFailedStep: async (
    runId: string,
    stepName: string,
  ): Promise<OverviewSyncRetryResult> => {
    return apiFetchJson<OverviewSyncRetryResult>(
      `/api/overview/sync/runs/${encodeURIComponent(runId)}/steps/${encodeURIComponent(stepName)}/retry`,
      { method: "POST" },
    );
  },

  startSync: async (): Promise<OverviewSyncStartResult> => {
    return apiFetchJson<OverviewSyncStartResult>("/api/overview/sync/runs", {
      method: "POST",
    });
  },
};
