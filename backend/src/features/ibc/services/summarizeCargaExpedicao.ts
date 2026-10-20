import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  ExpedicaoIbcRecord,
} from "../types/IbcExpedicao.types";
import { PedidoSomaCarga, pedidosNaSomaDaCarga } from "./pedidosNaSomaDaCarga";

export type PedidoIbcResumo = PedidoSomaCarga & {
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
  const elegiveis = pedidosNaSomaDaCarga(params.pedidos);
  const quantidadeEsperadaTotal = elegiveis.reduce(
    (sum, p) => sum + p.quantidadeEsperadaTotal,
    0,
  );
  const quantidadeAlocada = params.alocacoes.length;
  const temExpedicao = params.expedicao != null;
  const pedidosElegiveisCompletos =
    elegiveis.length > 0 && quantidadeAlocada === quantidadeEsperadaTotal;

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
