import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import {
  IBC_CARGAS_EM_VIAGEM_QUERY_KEY,
  IBC_CARGAS_EXPEDICAO_QUERY_KEY,
} from "../services/ibcRealtimeClient";
import { IBC_ENTRADAS_PATIO_QUERY_KEY, ibcEntradaPatioService } from "../services/ibcEntradaPatioService";
import { canAccessExpedicaoIbc } from "../utils/canAccessExpedicaoIbc";
import type { ExpedicaoIbcSection } from "../utils/expedicaoIbcSections";

export type ExpedicaoIbcTabCounts = Record<ExpedicaoIbcSection, number>;

export function useExpedicaoIbcTabCounts(): { counts: ExpedicaoIbcTabCounts; allowed: boolean } {
  const { user } = useAuth();
  const allowed = canAccessExpedicaoIbc(user?.role);

  const aguardando = useQuery({
    queryKey: IBC_CARGAS_EXPEDICAO_QUERY_KEY,
    queryFn: ibcExpedicaoService.listCargasExpedicao,
    enabled: allowed,
  });
  const emViagem = useQuery({
    queryKey: IBC_CARGAS_EM_VIAGEM_QUERY_KEY,
    queryFn: ibcExpedicaoService.listCargasEmViagem,
    enabled: allowed,
  });
  const entrada = useQuery({
    queryKey: IBC_ENTRADAS_PATIO_QUERY_KEY,
    queryFn: ibcEntradaPatioService.listar,
    enabled: allowed,
  });

  return {
    allowed,
    counts: {
      aguardando: aguardando.data?.length ?? 0,
      "em-viagem": emViagem.data?.length ?? 0,
      entrada: entrada.data?.length ?? 0,
    },
  };
}