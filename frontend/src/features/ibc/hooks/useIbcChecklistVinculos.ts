import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcChecklistService } from "../services/ibcChecklistService";
import { toError } from "../utils/toError";
import { IBC_CHECKLISTS_KEY } from "./useIbcChecklists";

const VINCULOS_KEY = ["ibc", "checklist-vinculos"] as const;

type VinculoVars = { ibcId: string; checklistModeloId: string };

export function useIbcChecklistVinculos(ibcId: string | null) {
  const queryClient = useQueryClient();
  const vinculosQuery = useQuery({
    queryKey: [...VINCULOS_KEY, ibcId],
    queryFn: () => ibcChecklistService.listVinculos(ibcId ?? ""),
    enabled: ibcId != null,
  });
  const checklistsQuery = useQuery({
    queryKey: IBC_CHECKLISTS_KEY,
    queryFn: ibcChecklistService.listChecklists,
    enabled: ibcId != null,
  });

  const onSuccess = (mensagem: string) => async (_data: unknown, { ibcId: id }: VinculoVars) => {
    toast.success(mensagem);
    await queryClient.invalidateQueries({ queryKey: [...VINCULOS_KEY, id] });
  };
  const onError = (fallback: string) => (err: unknown) => {
    toast.error(toError(err).message || fallback);
  };

  const vincularMutation = useMutation({
    mutationFn: ({ ibcId: id, checklistModeloId }: VinculoVars) =>
      ibcChecklistService.vincular(id, checklistModeloId),
    onSuccess: onSuccess("Checklist vinculado"),
    onError: onError("Falha ao vincular checklist"),
  });
  const desvincularMutation = useMutation({
    mutationFn: ({ ibcId: id, checklistModeloId }: VinculoVars) =>
      ibcChecklistService.desvincular(id, checklistModeloId),
    onSuccess: onSuccess("Checklist desvinculado"),
    onError: onError("Falha ao desvincular checklist"),
  });

  const run =
    (mutate: (vars: VinculoVars) => Promise<unknown>) =>
    async (checklistModeloId: string): Promise<boolean> => {
      if (!ibcId) return false;
      return mutate({ ibcId, checklistModeloId }).then(() => true, () => false);
    };

  const error = vinculosQuery.error ?? checklistsQuery.error;

  return {
    vinculos: vinculosQuery.data ?? [],
    checklists: checklistsQuery.data ?? [],
    isLoading: vinculosQuery.isLoading || checklistsQuery.isLoading,
    errorMessage: error ? toError(error).message : null,
    retry: () => {
      void vinculosQuery.refetch();
      void checklistsQuery.refetch();
    },
    vincular: run(vincularMutation.mutateAsync),
    desvincular: run(desvincularMutation.mutateAsync),
    isVinculando: vincularMutation.isPending,
    pendingChecklistId: desvincularMutation.isPending
      ? (desvincularMutation.variables?.checklistModeloId ?? null)
      : null,
  };
}

export type IbcChecklistVinculosState = ReturnType<typeof useIbcChecklistVinculos>;
