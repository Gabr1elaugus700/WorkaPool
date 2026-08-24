import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  ExpedicaoIbcRecord,
} from "../types/IbcExpedicao.types";
import { isPedidoIbcElegivel } from "./isPedidoIbcElegivel";

export type CargaExpedicaoListItem = {
  id: string;
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: Date;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  semIbc: boolean;
  temExpedicao: boolean;
  podeFecharExpedicao: boolean;
};

/** Sinal de embalagem 251001 no pedido (válido ou Pedido IBC inválido). */
function hasSinalContainerIbc(pedido: PedidoCargo): boolean {
  return pedido.isContainer || pedido.ibcInvalido;
}

function computePodeFecharExpedicao(params: {
  situacao: string;
  semIbc: boolean;
  temExpedicao: boolean;
  quantidadeEsperadaTotal: number;
  pedidosElegiveisCompletos: boolean;
}): boolean {
  return (
    params.situacao === "FECHADA" &&
    !params.semIbc &&
    !params.temExpedicao &&
    params.quantidadeEsperadaTotal > 0 &&
    params.pedidosElegiveisCompletos
  );
}

export function summarizeCargaExpedicao(params: {
  carga: CargaExpedicaoRef;
  pedidos: PedidoCargo[];
  alocacoes: AlocacaoIbcRecord[];
  expedicao: ExpedicaoIbcRecord | null;
}): CargaExpedicaoListItem {
  const elegiveis = params.pedidos.filter(isPedidoIbcElegivel);
  const quantidadeEsperadaTotal = elegiveis.reduce(
    (sum, p) => sum + p.quantidadeEsperadaTotal,
    0,
  );

  const countsByNumPed = new Map<string, number>();
  for (const alocacao of params.alocacoes) {
    const key = String(alocacao.numPed);
    countsByNumPed.set(key, (countsByNumPed.get(key) ?? 0) + 1);
  }

  const quantidadeAlocada = elegiveis.reduce((sum, pedido) => {
    return sum + (countsByNumPed.get(String(pedido.numPed)) ?? 0);
  }, 0);

  // semIbc = nenhum sinal 251001 (não “sem elegíveis”: só ibcInvalido ainda é acionável).
  const semIbc = !params.pedidos.some(hasSinalContainerIbc);
  const temExpedicao = params.expedicao != null;
  const pedidosElegiveisCompletos =
    elegiveis.length > 0 &&
    elegiveis.every((pedido) => {
      const alocado = countsByNumPed.get(String(pedido.numPed)) ?? 0;
      return alocado >= pedido.quantidadeEsperadaTotal;
    });

  return {
    id: params.carga.id,
    codCar: params.carga.codCar,
    destino: params.carga.destino,
    situacao: params.carga.situacao,
    previsaoSaida: params.carga.previsaoSaida,
    quantidadeAlocada,
    quantidadeEsperadaTotal,
    semIbc,
    temExpedicao,
    podeFecharExpedicao: computePodeFecharExpedicao({
      situacao: params.carga.situacao,
      semIbc,
      temExpedicao,
      quantidadeEsperadaTotal,
      pedidosElegiveisCompletos,
    }),
  };
}
