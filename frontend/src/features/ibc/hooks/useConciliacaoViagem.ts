import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { conciliacaoViagemService } from "../services/conciliacaoViagemService";
import type {
  ConciliacaoViagemClienteDTO,
  ConciliacaoViagemDTO,
  ConciliacaoViagemItemDTO,
  DestinoConciliacao,
} from "../types/conciliacaoViagem.types";
import { conciliacaoVolta } from "../utils/conciliacaoVolta.utils";
import { toError } from "../utils/toError";

type ClientePatch = Partial<Pick<ConciliacaoViagemClienteDTO, "quantidadePapel" | "confirmouDivergencia">>;

export function useConciliacaoViagem(codCar: number | null, enabled: boolean, onFechada: () => void) {
  const [viagem, setViagem] = useState<ConciliacaoViagemDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pedindoConfirmacao, setPedindoConfirmacao] = useState(false);

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

  const editar = (recipe: (atual: ConciliacaoViagemDTO) => ConciliacaoViagemDTO) => {
    setPedindoConfirmacao(false);
    setViagem((atual) => (atual ? recipe(atual) : atual));
  };

  const atualizarItem = (
    alocacaoIbcId: string,
    patch: (item: ConciliacaoViagemItemDTO) => ConciliacaoViagemItemDTO,
  ) => {
    editar((atual) => ({
      ...atual,
      itens: atual.itens.map((item) => (item.alocacaoIbcId === alocacaoIbcId ? patch(item) : item)),
    }));
  };

  const marcarDestino = (alocacaoIbcId: string, destino: DestinoConciliacao) =>
    atualizarItem(alocacaoIbcId, (atual) => ({
      ...atual,
      destino,
      numPed: destino === "RETORNOU" ? null : atual.numPed,
      codCli: destino === "RETORNOU" ? null : atual.codCli,
      cliente: destino === "RETORNOU" ? "" : atual.cliente,
      modalidade: null,
    }));

  const marcarPedido = (alocacaoIbcId: string, numPed: string) =>
    editar((atual) => {
      const pedido = atual.pedidos.find((item) => item.numPed === numPed);
      return {
        ...atual,
        itens: atual.itens.map((item) => item.alocacaoIbcId !== alocacaoIbcId ? item : {
          ...item,
          numPed,
          codCli: pedido?.codCli ?? null,
          cliente: pedido?.cliente ?? "",
        }),
      };
    });

  const vincularTroca = (alocacaoIbcId: string, ibcEntradaId: string) =>
    atualizarItem(alocacaoIbcId, (atual) => ({ ...atual, ibcEntradaId }));

  const atualizarCliente = (chaveCliente: string, patch: ClientePatch) =>
    editar((atual) => ({
      ...atual,
      clientes: atual.clientes.map((cliente) => (cliente.chaveCliente === chaveCliente ? { ...cliente, ...patch } : cliente)),
    }));

  const persistir = async (): Promise<ConciliacaoViagemDTO | null> => {
    if (!viagem || codCar == null) return null;
    const incompleta = viagem.itens.find(
      (item) => (item.destino === "FICOU" || item.destino === "TROCA") && !item.numPed,
    );
    if (incompleta) {
      setAviso(`Escolha o pedido do IBC ${incompleta.identificador}.`);
      return null;
    }
    const salva = await conciliacaoViagemService.salvar(codCar, {
      itens: viagem.itens.flatMap((item) => item.destino == null ? [] : [{
        alocacaoIbcId: item.alocacaoIbcId,
        destino: item.destino,
        ...(item.destino === "RETORNOU" || !item.numPed ? {} : { numPed: item.numPed }),
      }]),
      retornosSemId: viagem.clientes.flatMap((cliente) => cliente.quantidadePapel == null ? [] : [{
        chaveCliente: cliente.chaveCliente,
        quantidadePapel: cliente.quantidadePapel,
        confirmouDivergencia: cliente.confirmouDivergencia,
      }]),
    });
    setViagem(salva);
    return salva;
  };

  const fecharNoServidor = async (salva: ConciliacaoViagemDTO) => {
    if (codCar == null) return;
    const confirmacoes = conciliacaoVolta.confirmacoes(conciliacaoVolta.barras(salva.pedidos, salva.itens));
    await conciliacaoViagemService.fechar(codCar, confirmacoes.length > 0 ? { confirmacoes } : {});
    setPedindoConfirmacao(false);
    toast.success("Viagem fechada.");
    onFechada();
  };

  const executar = async (fechar: boolean) => {
    setSalvando(true);
    setAviso(null);
    try {
      const salva = await persistir();
      if (!salva) return;
      if (!fechar) {
        toast.success("Conciliação salva.");
        return;
      }
      const pendentes = conciliacaoVolta.confirmacoes(conciliacaoVolta.barras(salva.pedidos, salva.itens));
      if (pendentes.length > 0) {
        setPedindoConfirmacao(true);
        return;
      }
      await fecharNoServidor(salva);
    } catch (err) {
      setAviso(toError(err).message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarFechamento = async () => {
    setSalvando(true);
    setAviso(null);
    try {
      const salva = await persistir();
      if (!salva) return;
      await fecharNoServidor(salva);
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
  const barras = viagem ? conciliacaoVolta.barras(viagem.pedidos, viagem.itens) : [];

  return {
    viagem,
    loading,
    error,
    aviso,
    salvando,
    fechada,
    marcados,
    total,
    barras,
    divergencias: conciliacaoVolta.divergentes(barras),
    pedindoConfirmacao,
    podeFechar: !salvando && marcados === total && total > 0 && papelCompleto,
    marcarDestino,
    marcarPedido,
    vincularTroca,
    atualizarCliente,
    salvarAndamento: () => executar(false),
    fecharViagem: () => executar(true),
    confirmarFechamento,
    cancelarConfirmacao: () => setPedindoConfirmacao(false),
  };
}
