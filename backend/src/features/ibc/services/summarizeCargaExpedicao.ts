import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  ExpedicaoIbcRecord,
} from "../types/IbcExpedicao.types";
import {
  isPedidoIbcElegivel,
  PedidoIbcElegibilidade,
} from "./isPedidoIbcElegivel";

export type PedidoIbcResumo = PedidoIbcElegibilidade & {
  numPed: string | number;
};

export type CargaExpedicaoListItem = {
  id: string;
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: Date;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  temExpedicao: boolean;
  podeFecharExpedicao: boolean;
};

function computePodeFecharExpedicao(params: {
  situacao: string;
  temExpedicao: boolean;
  quantidadeEsperadaTotal: number;
  pedidosElegiveisCompletos: boolean;
}): boolean {
  return (
    params.situacao === "FECHADA" &&
    !params.temExpedicao &&
    params.quantidadeEsperadaTotal > 0 &&
    params.pedidosElegiveisCompletos
  );
}

export function summarizeCargaExpedicao(params: {
  carga: CargaExpedicaoRef;
  pedidos: PedidoIbcResumo[];
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
    temExpedicao,
    podeFecharExpedicao: computePodeFecharExpedicao({
      situacao: params.carga.situacao,
      temExpedicao,
      quantidadeEsperadaTotal,
      pedidosElegiveisCompletos,
    }),
  };
}
