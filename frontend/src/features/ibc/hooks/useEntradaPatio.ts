import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { ibcCadastroLabels } from "../utils/ibcCadastroLabels";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import { toError } from "../utils/toError";
import { IBC_ENTRADAS_PATIO_QUERY_KEY, ibcEntradaPatioService } from "../services/ibcEntradaPatioService";
import type { EntradaPatioConcluida } from "../types/ibcEntradaPatio.types";

function mensagemConclusao(result: EntradaPatioConcluida): string {
  if (result.aptidao === "APTO") return `${result.identificador} entrou no pátio: Apto`;
  const motivo = result.motivoInaptidao ? ibcCadastroLabels.motivoInaptidao[result.motivoInaptidao] : "Inapto";
  return `${result.identificador} entrou no pátio: Inapto · ${motivo}`;
}

export function useEntradaPatio() {
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: IBC_ENTRADAS_PATIO_QUERY_KEY,
    queryFn: ibcEntradaPatioService.listar,
    enabled: allowed,
  });
  const concluir = useMutation({
    mutationFn: ibcEntradaPatioService.concluir,
    onSuccess: async (result) => {
      toast.success(mensagemConclusao(result));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: IBC_ENTRADAS_PATIO_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["ibc", "pool"] }),
        queryClient.invalidateQueries({ queryKey: ["ibc", "alerts"] }),
      ]);
    },
    onError: (err) => {
      toast.error(toError(err).message || "Falha ao concluir a entrada");
    },
  });

  return { allowed, concluir, ...query };
}
