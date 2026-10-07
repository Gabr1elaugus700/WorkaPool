import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcChecklistService } from "../services/ibcChecklistService";
import type { UpdateIbcChecklistItemInput } from "../types/ibcChecklist.types";
import { toError } from "../utils/toError";

export const IBC_CHECKLIST_ITENS_KEY = ["ibc", "checklist-itens"] as const;

export function useIbcChecklistItens(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: IBC_CHECKLIST_ITENS_KEY,
    queryFn: ibcChecklistService.listItens,
    enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: IBC_CHECKLIST_ITENS_KEY });

  const createMutation = useMutation({
    mutationFn: ibcChecklistService.createItem,
    onSuccess: async (item) => {
      toast.success(`Item "${item.descricao}" cadastrado`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao cadastrar item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIbcChecklistItemInput }) =>
      ibcChecklistService.updateItem(id, input),
    onSuccess: async () => {
      toast.success("Item atualizado");
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao atualizar item");
    },
  });

  return {
    query,
    createItem: createMutation.mutateAsync,
    updateItem: (id: string, input: UpdateIbcChecklistItemInput) =>
      updateMutation.mutateAsync({ id, input }),
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
