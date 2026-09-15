import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OverviewSyncService } from "../services/overviewSyncService";

const STATUS_KEY = ["overview-sync-status"] as const;
const RUNS_KEY = ["overview-sync-runs"] as const;

export function useOverviewSyncStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => OverviewSyncService.getStatus(),
    staleTime: 1000 * 30,
  });
}

export function useOverviewSyncRuns(limit = 50) {
  return useQuery({
    queryKey: [...RUNS_KEY, limit],
    queryFn: async () => {
      const response = await OverviewSyncService.listRuns(limit);
      return response.runs;
    },
    staleTime: 1000 * 30,
  });
}

export function useRetryOverviewSyncFailedStep() {
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  const retryFailedStep = useCallback(
    async (runId: string, stepName: string) => {
      setIsRetrying(true);
      try {
        const result = await OverviewSyncService.retryFailedStep(
          runId,
          stepName,
        );
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
          queryClient.invalidateQueries({ queryKey: RUNS_KEY }),
        ]);
        if (result.published) {
          toast.success("Step retentado com sucesso; snapshot publicado.");
        } else {
          toast.error(
            result.run.errorSummary ??
              "Retry concluído, mas o run ainda falhou.",
          );
        }
        return result;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Falha ao retentar step";
        toast.error(message);
        return null;
      } finally {
        setIsRetrying(false);
      }
    },
    [queryClient],
  );

  return { retryFailedStep, isRetrying };
}

export function useStartOverviewSync() {
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const startSync = useCallback(async () => {
    setIsStarting(true);
    try {
      const result = await OverviewSyncService.startSync();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
        queryClient.invalidateQueries({ queryKey: RUNS_KEY }),
      ]);
      toast.success("Sincronização iniciada com sucesso.");
      return result;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Falha ao iniciar sincronização";
      toast.error(message);
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [queryClient]);

  return { startSync, isStarting };
}
