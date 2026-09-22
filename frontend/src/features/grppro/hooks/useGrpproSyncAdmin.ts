import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GrpproSyncService } from "../services/grpproSyncService";

const STATUS_KEY = ["grppro-sync-status"] as const;
const RUNS_KEY = ["grppro-sync-runs"] as const;

export function useGrpproSyncStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => GrpproSyncService.getStatus(),
    staleTime: 1000 * 30,
  });
}

export function useGrpproSyncRuns(limit = 50) {
  return useQuery({
    queryKey: [...RUNS_KEY, limit],
    queryFn: async () => {
      const response = await GrpproSyncService.listRuns(limit);
      return response.runs;
    },
    staleTime: 1000 * 30,
  });
}

export function useStartGrpproSync() {
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const startSync = useCallback(async () => {
    setIsStarting(true);
    try {
      const result = await GrpproSyncService.startSync();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
        queryClient.invalidateQueries({ queryKey: RUNS_KEY }),
      ]);
      if (result.published) {
        toast.success("Sincronização GrpPro concluída com sucesso.");
      } else {
        toast.error(
          result.run.error ?? "Sincronização concluída, mas o espelho não foi publicado.",
        );
      }
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
