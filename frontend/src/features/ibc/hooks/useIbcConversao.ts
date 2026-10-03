import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcCadastroService } from "../services/ibcCadastroService";
import type {
  ChangeIbcProdutoInput,
  IbcMudancaConfirmacaoInput,
} from "../types/ibcCadastro.types";
import { toError } from "../utils/toError";

const HISTORICO_KEY = ["ibc", "historico"] as const;

export function useIbcConversao() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["ibc", "pool"] }),
      queryClient.invalidateQueries({ queryKey: ["ibc", "alerts"] }),
      queryClient.invalidateQueries({ queryKey: HISTORICO_KEY }),
    ]);
  };

  const converterMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: IbcMudancaConfirmacaoInput }) =>
      ibcCadastroService.convertToNaoHomologado(id, input),
    onSuccess: async (created) => {
      toast.success(`IBC convertido: novo identificador ${created.identificador}`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao converter IBC");
    },
  });

  const mudarProdutoMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ChangeIbcProdutoInput }) =>
      ibcCadastroService.changeProduto(id, input),
    onSuccess: async (created) => {
      toast.success(`Produto alterado: novo identificador ${created.identificador}`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao alterar produto do IBC");
    },
  });

  return {
    converter: (id: string, input: IbcMudancaConfirmacaoInput) =>
      converterMutation.mutateAsync({ id, input }),
    mudarProduto: (id: string, input: ChangeIbcProdutoInput) =>
      mudarProdutoMutation.mutateAsync({ id, input }),
    isPending: converterMutation.isPending || mudarProdutoMutation.isPending,
  };
}

export function useIbcHistorico(ibcId: string | null) {
  return useQuery({
    queryKey: [...HISTORICO_KEY, ibcId],
    queryFn: () => ibcCadastroService.listHistorico(ibcId ?? ""),
    enabled: ibcId != null,
  });
}
