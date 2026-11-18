import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { conciliacaoViagemService } from "../services/conciliacaoViagemService";
import type {
  ConciliacaoViagemDTO,
  DestinoConciliacao,
} from "../types/conciliacaoViagem.types";
import { conciliacaoVolta } from "../utils/conciliacaoVolta.utils";
import { toError } from "../utils/toError";

export function useConciliacaoViagem(codCar: number | null, enabled: boolean, onFechada: () => void) {
  const [viagem, setViagem] = useState<ConciliacaoViagemDTO | null>(null);
  const [chegaramAMais, setChegaramAMais] = useState("0");
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
      const carregada = await conciliacaoViagemService.consultar(codCar);
      setViagem(carregada);
      setChegaramAMais(String(carregada.chegaramAMais));
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [codCar]);

  useEffect(() => {
    if (enabled) void carregar();
  }, [enabled, carregar]);

  const alternarDestino = (alocacaoIbcId: string, destino: DestinoConciliacao, numPed: string | null) => {
    setPedindoConfirmacao(false);
    setViagem((atual) => (
      atual
        ? { ...atual, itens: conciliacaoVolta.alternarDestino(atual.itens, atual.pedidos, alocacaoIbcId, destino, numPed) }
        : atual
    ));
  };

  const alterarChegaramAMais = (valor: string) => {
    setPedindoConfirmacao(false);
    setChegaramAMais(valor);
  };

  const persistir = async (): Promise<ConciliacaoViagemDTO | null> => {
    if (!viagem || codCar == null) return null;
    const lido = conciliacaoVolta.lerChegaramAMais(chegaramAMais);
    if (!lido.ok) {
      setAviso("Informe um inteiro não negativo em Chegaram a mais.");
      return null;
    }
    const salva = await conciliacaoViagemService.salvar(codCar, {
      itens: viagem.itens.flatMap((item) => !conciliacaoVolta.temDestino(item) || item.destino == null ? [] : [{
        alocacaoIbcId: item.alocacaoIbcId,
        destino: item.destino,
        ...(item.destino === "RETORNOU" || !item.numPed ? {} : { numPed: item.numPed }),
      }]),
      chegaramAMais: lido.valor,
    });
    setViagem(salva);
    setChegaramAMais(String(salva.chegaramAMais));
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
  const marcados = viagem?.itens.filter(conciliacaoVolta.temDestino).length ?? 0;
  const total = viagem?.itens.length ?? 0;
  const barras = viagem ? conciliacaoVolta.barras(viagem.pedidos, viagem.itens) : [];

  return {
    viagem,
    chegaramAMais,
    loading,
    error,
    aviso,
    salvando,
    fechada,
    marcados,
    total,
    divergencias: conciliacaoVolta.divergentes(barras),
    pedindoConfirmacao,
    podeFechar: !fechada && !salvando && marcados === total && total > 0,
    alternarDestino,
    alterarChegaramAMais,
    salvarAndamento: () => executar(false),
    fecharViagem: () => executar(true),
    confirmarFechamento,
    cancelarConfirmacao: () => setPedindoConfirmacao(false),
  };
}
