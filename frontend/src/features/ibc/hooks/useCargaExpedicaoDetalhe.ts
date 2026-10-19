import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import type { CargaExpedicaoDetalheDTO } from "../types/ibcExpedicao.types";
import { IbcAlocacaoRequestError } from "../utils/ibcAlocacaoError";
import { toError } from "../utils/toError";

export type SubstituidoNotice = {
  numPed: string;
  title: string;
  message: string;
};

export function useCargaExpedicaoDetalhe(codCar: number | null, enabled: boolean) {
  const [detalhe, setDetalhe] = useState<CargaExpedicaoDetalheDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allocatingNumPed, setAllocatingNumPed] = useState<string | null>(null);
  const [substituidoNotice, setSubstituidoNotice] = useState<SubstituidoNotice | null>(null);
  const [deallocatingId, setDeallocatingId] = useState<string | null>(null);
  const [fechando, setFechando] = useState(false);

  const carregar = useCallback(async () => {
    if (codCar == null) {
      setError(new Error("Código de carga inválido."));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetalhe(await ibcExpedicaoService.getCargaExpedicao(codCar));
    } catch (err) {
      setError(toError(err));
    } finally {
      setLoading(false);
    }
  }, [codCar]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void carregar();
  }, [enabled, carregar]);

  const vincular = async (numPed: string, identificador: string): Promise<boolean> => {
    if (codCar == null) return false;
    setAllocatingNumPed(numPed);
    setSubstituidoNotice((current) => (current?.numPed === numPed ? null : current));
    try {
      await ibcExpedicaoService.createAlocacao({ codCar, numPed, identificador });
      setSubstituidoNotice(null);
      toast.success(`IBC ${identificador} vinculado ao pedido ${numPed}`);
      await carregar();
      return true;
    } catch (err) {
      if (err instanceof IbcAlocacaoRequestError && err.substituido && err.title) {
        setSubstituidoNotice({ numPed, title: err.title, message: err.message });
        return false;
      }
      toast.error(toError(err).message);
      return true;
    } finally {
      setAllocatingNumPed(null);
    }
  };

  const desvincular = async (alocacaoId: string) => {
    setDeallocatingId(alocacaoId);
    try {
      await ibcExpedicaoService.removeAlocacao(alocacaoId);
      toast.success("IBC desvinculado");
      await carregar();
    } catch (err) {
      toast.error(toError(err).message);
    } finally {
      setDeallocatingId(null);
    }
  };

  const fecharExpedicao = async () => {
    if (codCar == null) return;
    setFechando(true);
    try {
      await ibcExpedicaoService.fecharExpedicao({ codCar });
      toast.success("Expedição IBC fechada — IBCs em viagem");
      await carregar();
    } catch (err) {
      toast.error(toError(err).message);
    } finally {
      setFechando(false);
    }
  };

  return {
    detalhe,
    loading,
    error,
    allocatingNumPed,
    substituidoNotice,
    deallocatingId,
    fechando,
    vincular,
    desvincular,
    fecharExpedicao,
  };
}
