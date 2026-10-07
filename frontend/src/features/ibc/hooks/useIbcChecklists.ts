import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcChecklistService } from "../services/ibcChecklistService";
import type { UpdateIbcChecklistInput } from "../types/ibcChecklist.types";
import { toError } from "../utils/toError";

const IBC_CHECKLISTS_KEY = ["ibc", "checklists"] as const;

export function useIbcChecklists(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: IBC_CHECKLISTS_KEY,
    queryFn: ibcChecklistService.listChecklists,
    enabled,
  });

  const onError = (fallback: string) => (err: unknown) => {
    toast.error(toError(err).message || fallback);
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: IBC_CHECKLISTS_KEY });

  const createMutation = useMutation({
    mutationFn: ibcChecklistService.createChecklist,
    onSuccess: async (checklist) => {
      toast.success(`Checklist "${checklist.nome}" cadastrado`);
      await invalidate();
    },
    onError: onError("Falha ao cadastrar checklist"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIbcChecklistInput }) =>
      ibcChecklistService.updateChecklist(id, input),
    onSuccess: async (checklist) => {
      toast.success(`Checklist "${checklist.nome}" atualizado`);
      await invalidate();
    },
    onError: onError("Falha ao atualizar checklist"),
  });

  return {
    query,
    loadChecklist: (id: string) =>
      queryClient
        .fetchQuery({
          queryKey: [...IBC_CHECKLISTS_KEY, id],
          queryFn: () => ibcChecklistService.getChecklist(id),
        })
        .catch((err: unknown) => {
          onError("Falha ao carregar checklist")(err);
          throw err;
        }),
    createChecklist: createMutation.mutateAsync,
    updateChecklist: (id: string, input: UpdateIbcChecklistInput) =>
      updateMutation.mutateAsync({ id, input }),
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
