import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcCadastroService } from "../services/ibcCadastroService";
import type { CreateIbcProdutoInput } from "../types/ibcCadastro.types";
import { toError } from "../utils/toError";

const POOL_KEY = ["ibc", "pool"] as const;
const ALERTS_KEY = ["ibc", "alerts"] as const;
const PRODUTOS_KEY = ["ibc", "produtos"] as const;

function useInvalidateCadastro() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: POOL_KEY }),
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY }),
      queryClient.invalidateQueries({ queryKey: PRODUTOS_KEY }),
    ]);
  };
}

export function useIbcPool(enabled: boolean, incluirHistorico: boolean) {
  return useQuery({
    queryKey: [...POOL_KEY, incluirHistorico],
    queryFn: () => ibcCadastroService.listPool(incluirHistorico),
    enabled,
  });
}

export function useIbcAlerts(enabled: boolean) {
  return useQuery({ queryKey: ALERTS_KEY, queryFn: ibcCadastroService.listAlerts, enabled });
}

export function useIbcProdutos(enabled: boolean) {
  return useQuery({ queryKey: PRODUTOS_KEY, queryFn: ibcCadastroService.listProdutos, enabled });
}

export function useCadastrarIbc() {
  const invalidate = useInvalidateCadastro();

  const unitario = useMutation({
    mutationFn: ibcCadastroService.createNovo,
    onSuccess: async (created) => {
      toast.success(`IBC ${created.identificador} cadastrado`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao cadastrar IBC");
    },
  });

  const lote = useMutation({
    mutationFn: ibcCadastroService.createLote,
    onSuccess: async (result) => {
      toast.success(`Lote com ${result.items.length} IBCs cadastrado`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao cadastrar lote de IBC");
    },
  });

  return { unitario, lote, isPending: unitario.isPending || lote.isPending };
}

export function useIbcProdutoMutations() {
  const invalidate = useInvalidateCadastro();

  const create = useMutation({
    mutationFn: ibcCadastroService.createProduto,
    onSuccess: async (created) => {
      toast.success(`Produto ${created.nome} (${created.abreviacao}) cadastrado`);
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao cadastrar produto");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateIbcProdutoInput }) =>
      ibcCadastroService.updateProduto(id, input),
    onSuccess: async () => {
      toast.success("Produto atualizado");
      await invalidate();
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao atualizar produto");
    },
  });

  return {
    criar: (input: CreateIbcProdutoInput) => create.mutateAsync(input),
    atualizar: (id: string, input: CreateIbcProdutoInput) => update.mutateAsync({ id, input }),
    isPending: create.isPending || update.isPending,
  };
}
