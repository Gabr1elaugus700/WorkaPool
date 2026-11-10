import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ibcChecklistService } from "../services/ibcChecklistService";
import { ibcChecklistPadraoService } from "../services/ibcChecklistPadraoService";

export function useIbcChecklistPadrao(produtoId: string | null, canWrite: boolean) {
  const queryClient = useQueryClient();
  const key = ["ibc", "checklist-padrao", produtoId] as const;
  const enabled = produtoId != null;

  const query = useQuery({
    queryKey: key,
    queryFn: () => ibcChecklistPadraoService.list(produtoId as string),
    enabled,
  });

  const modelos = useQuery({
    queryKey: ["ibc", "checklists"],
    queryFn: () => ibcChecklistService.listChecklists(),
    enabled: enabled && canWrite,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
  };

  const vincular = useMutation({
    mutationFn: (checklistModeloId: string) =>
      ibcChecklistPadraoService.vincular(produtoId as string, checklistModeloId),
    onSuccess: invalidate,
  });

  const desvincular = useMutation({
    mutationFn: (checklistModeloId: string) =>
      ibcChecklistPadraoService.desvincular(produtoId as string, checklistModeloId),
    onSuccess: invalidate,
  });

  return { query, modelos, vincular, desvincular };
}
