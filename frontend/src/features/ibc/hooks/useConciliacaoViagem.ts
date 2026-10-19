import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { conciliacaoViagemService } from "../services/conciliacaoViagemService";
import type {
  ConciliacaoViagemClienteDTO,
  ConciliacaoViagemDTO,
  ConciliacaoViagemItemDTO,
  DestinoConciliacao,
  ModalidadeConciliacao,
} from "../types/conciliacaoViagem.types";
import { toError } from "../utils/toError";

type ClientePatch = Partial<Pick<ConciliacaoViagemClienteDTO, "quantidadePapel" | "confirmouDivergencia">>;

export function useConciliacaoViagem(codCar: number | null, enabled: boolean, onFechada: () => void) {
  const [viagem, setViagem] = useState<ConciliacaoViagemDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (codCar == null) return;
    setLoading(true);
    setError(null);
    try {
      setViagem(await conciliacaoViagemService.consultar(codCar));
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [codCar]);

  useEffect(() => {
    if (enabled) void carregar();
  }, [enabled, carregar]);

  const atualizarItem = (
    alocacaoIbcId: string,
    patch: (item: ConciliacaoViagemItemDTO) => ConciliacaoViagemItemDTO,
  ) => {
    setViagem((atual) => atual && {
      ...atual,
      itens: atual.itens.map((item) => (item.alocacaoIbcId === alocacaoIbcId ? patch(item) : item)),
    });
  };

  const marcarDestino = (alocacaoIbcId: string, destino: DestinoConciliacao) =>
    atualizarItem(alocacaoIbcId, (atual) => ({
      ...atual,
      destino,
      modalidade: destino === "FICOU" ? atual.modalidade ?? atual.modalidadeSugerida : null,
    }));

  const marcarModalidade = (alocacaoIbcId: string, modalidade: ModalidadeConciliacao) =>
    atualizarItem(alocacaoIbcId, (atual) => ({ ...atual, modalidade }));

  const vincularTroca = (alocacaoIbcId: string, ibcEntradaId: string) =>
    atualizarItem(alocacaoIbcId, (atual) => ({ ...atual, ibcEntradaId }));

  const atualizarCliente = (chaveCliente: string, patch: ClientePatch) =>
    setViagem((atual) => atual && {
      ...atual,
      clientes: atual.clientes.map((cliente) => (cliente.chaveCliente === chaveCliente ? { ...cliente, ...patch } : cliente)),
    });

  const persistir = async (): Promise<boolean> => {
    if (!viagem || codCar == null) return false;
    const incompleta = viagem.itens.find((item) => item.destino === "FICOU" && item.modalidade == null);
    if (incompleta) {
      setAviso(`Escolha venda ou empréstimo para o IBC ${incompleta.identificador}.`);
      return false;
    }
    const salva = await conciliacaoViagemService.salvar(codCar, {
      itens: viagem.itens.flatMap((item) => item.destino == null ? [] : [{
        alocacaoIbcId: item.alocacaoIbcId,
        destino: item.destino,
        modalidade: item.modalidade,
      }]),
      retornosSemId: viagem.clientes.flatMap((cliente) => cliente.quantidadePapel == null ? [] : [{
        chaveCliente: cliente.chaveCliente,
        quantidadePapel: cliente.quantidadePapel,
        confirmouDivergencia: cliente.confirmouDivergencia,
      }]),
    });
    setViagem(salva);
    return true;
  };

  const executar = async (fechar: boolean) => {
    setSalvando(true);
    setAviso(null);
    try {
      if (!(await persistir())) return;
      if (!fechar) {
        toast.success("Conciliação salva.");
        return;
      }
      if (codCar == null) return;
      await conciliacaoViagemService.fechar(codCar);
      toast.success("Viagem fechada.");
      onFechada();
    } catch (err) {
      setAviso(toError(err).message);
    } finally {
      setSalvando(false);
    }
  };

  const fechada = viagem?.viagemFechadaEm != null;
  const marcados = viagem?.itens.filter((item) => item.destino != null).length ?? 0;
  const total = viagem?.itens.length ?? 0;
  const papelCompleto = viagem?.clientes.every((cliente) => cliente.quantidadePapel != null) ?? false;

  return {
    viagem,
    loading,
    error,
    aviso,
    salvando,
    fechada,
    marcados,
    total,
    podeFechar: !salvando && marcados === total && total > 0 && papelCompleto,
    marcarDestino,
    marcarModalidade,
    vincularTroca,
    atualizarCliente,
    salvarAndamento: () => executar(false),
    fecharViagem: () => executar(true),
  };
}
