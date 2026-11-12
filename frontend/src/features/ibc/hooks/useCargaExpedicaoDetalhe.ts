import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import { containersCargaQueryKey } from "./useContainersCarga";
import type { CargaExpedicaoDetalheDTO } from "../types/ibcExpedicao.types";
import { IbcAlocacaoRequestError } from "../utils/ibcAlocacaoError";
import { ibcProdutoCompatibilidade } from "../utils/ibcProdutoCompatibilidade";
import { toError } from "../utils/toError";

export type SubstituidoNotice = {
  title: string;
  message: string;
};

export function useCargaExpedicaoDetalhe(codCar: number | null, enabled: boolean) {
  const [detalhe, setDetalhe] = useState<CargaExpedicaoDetalheDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [allocating, setAllocating] = useState(false);
  const [substituidoNotice, setSubstituidoNotice] = useState<SubstituidoNotice | null>(null);
  const [deallocatingId, setDeallocatingId] = useState<string | null>(null);
  const [fechando, setFechando] = useState(false);
  const [anuncio, setAnuncio] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const vincular = async (identificador: string): Promise<boolean> => {
    if (codCar == null) return false;
    setAllocating(true);
    setSubstituidoNotice(null);
    try {
      const criado = await ibcExpedicaoService.createAlocacao({ codCar, identificador });
      toast.success(`IBC ${identificador} vinculado à carga`);
      const avisos = ibcProdutoCompatibilidade.avisosDe(criado.avisos);
      if (avisos.length > 0) {
        toast.warning(ibcProdutoCompatibilidade.textoAvisos(avisos), { duration: 8000 });
      }
      await carregar();
      await queryClient.invalidateQueries({ queryKey: containersCargaQueryKey(codCar) });
      setAnuncio(`${identificador} vinculado à carga`);
      return true;
    } catch (err) {
      if (err instanceof IbcAlocacaoRequestError && err.title) {
        setSubstituidoNotice({ title: err.title, message: err.message });
        return false;
      }
      toast.error(toError(err).message);
      return true;
    } finally {
      setAllocating(false);
    }
  };

  const desvincular = async (alocacaoId: string) => {
    setDeallocatingId(alocacaoId);
    try {
      const identificador = detalhe?.alocacoes.find((item) => item.id === alocacaoId)?.identificador;
      await ibcExpedicaoService.removeAlocacao(alocacaoId);
      toast.success("IBC desvinculado");
      await carregar();
      if (codCar != null) {
        await queryClient.invalidateQueries({ queryKey: containersCargaQueryKey(codCar) });
      }
      setAnuncio(`${identificador ?? "Container"} desvinculado da carga`);
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
    allocating,
    substituidoNotice,
    deallocatingId,
    fechando,
    anuncio,
    vincular,
    desvincular,
    fecharExpedicao,
  };
}
