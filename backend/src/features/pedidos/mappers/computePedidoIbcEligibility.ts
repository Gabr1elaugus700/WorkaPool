/**
 * Resultado agregado de elegibilidade IBC por Pedido (backend-only).
 * Cap de AlocacaoIbc / Fechar expedição usa quantidadeEsperadaTotal nesta fatia.
 */
export type PedidoIbcEligibility = {
  isContainer: boolean;
  quantidadeEsperadaTotal: number;
  quantidadeEsperadaVenda: number;
  quantidadeEsperadaEmprestimo: number;
  /** Pedido IBC inválido — bloqueia alocação neste Pedido e sinaliza alerta ALMOX. */
  ibcInvalido: boolean;
};

export type PedidoIbcLineInput = {
  CODIGO_EMBALAGEM?: number | string | null;
  VOLUME_EMBALAGEM?: number | string | null;
  /** Numerador — mapeado de QUANTIDADE / ipd.qtdped (QUANTIDADE_PEDIDO). */
  QUANTIDADE: number;
  INCLUSO?: string | null;
};

/** Código Sapiens (der.usu_codemb) que identifica linha de container IBC. */
export const CODIGO_EMBALAGEM_IBC = 251001;

/**
 * Agrega linhas brutas de um Pedido em elegibilidade IBC.
 * Só linhas com CODIGO_EMBALAGEM = 251001 entram no cálculo.
 */
export function computePedidoIbcEligibility(
  lines: PedidoIbcLineInput[],
): PedidoIbcEligibility {
  let quantidadeEsperadaVenda = 0;
  let quantidadeEsperadaEmprestimo = 0;
  let ibcInvalido = false;

  for (const line of lines) {
    if (Number(line.CODIGO_EMBALAGEM) !== CODIGO_EMBALAGEM_IBC) {
      continue;
    }

    const volume = Number(line.VOLUME_EMBALAGEM);
    const quantidadePedido = Number(line.QUANTIDADE);

    if (!Number.isFinite(volume) || volume <= 0) {
      ibcInvalido = true;
      continue;
    }

    const containers = quantidadePedido / volume;
    if (!Number.isInteger(containers)) {
      ibcInvalido = true;
      continue;
    }

    const incluso = String(line.INCLUSO ?? '')
      .trim()
      .toUpperCase();

    if (incluso === 'S') {
      quantidadeEsperadaVenda += containers;
    } else {
      quantidadeEsperadaEmprestimo += containers;
    }
  }

  if (ibcInvalido) {
    return {
      isContainer: false,
      quantidadeEsperadaTotal: 0,
      quantidadeEsperadaVenda: 0,
      quantidadeEsperadaEmprestimo: 0,
      ibcInvalido: true,
    };
  }

  const quantidadeEsperadaTotal =
    quantidadeEsperadaVenda + quantidadeEsperadaEmprestimo;

  return {
    isContainer: quantidadeEsperadaTotal > 0,
    quantidadeEsperadaTotal,
    quantidadeEsperadaVenda,
    quantidadeEsperadaEmprestimo,
    ibcInvalido: false,
  };
}
