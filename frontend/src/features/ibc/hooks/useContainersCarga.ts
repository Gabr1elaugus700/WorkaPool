import { useCallback, useEffect, useMemo, useState } from "react";
import { ibcExpedicaoService } from "../services/ibcExpedicaoService";
import type { ContainersCargaDTO } from "../types/ibcExpedicao.types";
import { containersCarga } from "../utils/containersCarga";
import { toError } from "../utils/toError";

/**
 * Paleta da Preparação. `versao` muda a cada recarga do detalhe da carga,
 * então vincular e desvincular já disparam a nova leitura.
 */
export function useContainersCarga(codCar: number, versao: unknown) {
  const [dados, setDados] = useState<ContainersCargaDTO | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    ibcExpedicaoService
      .getContainersCarga(codCar)
      .then((resposta) => {
        if (!ativo) return;
        setDados(resposta);
        setError(null);
      })
      .catch((err: unknown) => {
        if (ativo) setError(toError(err));
      });
    return () => {
      ativo = false;
    };
  }, [codCar, versao, tentativa]);

  const paleta = useMemo(() => (dados ? containersCarga.montar(dados) : null), [dados]);
  const recarregar = useCallback(() => {
    setError(null);
    setTentativa((n) => n + 1);
  }, []);

  return { paleta, error, recarregar };
}
