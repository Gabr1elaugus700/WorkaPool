import { AppError } from "../../../utils/AppError";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
} from "../types/IbcExpedicao.types";

export type CargaFotoLookup = Pick<
  IIbcExpedicaoRepository,
  "getCargaByCodCar" | "listPedidosIbcByCargaId"
>;

export type CargaFotoExpedicao = {
  carga: CargaExpedicaoRef;
  pedidosIbc: CargaPedidoIbcSnapshot[];
};

/**
 * Preparação e Fechar expedição só existem em Carga FECHADA com foto `CargaPedidoIbc`;
 * a foto é a única fonte dos pedidos IBC (o Sapiens muda `sitped` ao faturar).
 */
export async function loadCargaFotoExpedicao(
  repository: CargaFotoLookup,
  codCar: number,
): Promise<CargaFotoExpedicao> {
  const carga = await repository.getCargaByCodCar(codCar);
  if (!carga) {
    throw new AppError({
      message: `Carga ${codCar} não encontrada`,
      statusCode: 404,
      code: "IBC_CARGA_NOT_FOUND",
      details: { codCar },
    });
  }

  if (carga.situacao !== "FECHADA") {
    throw new AppError({
      message: `Carga ${codCar} precisa estar FECHADA para a preparação de expedição IBC`,
      statusCode: 409,
      code: "IBC_CARGA_NAO_FECHADA",
      details: { codCar, situacao: carga.situacao },
    });
  }

  const pedidosIbc = await repository.listPedidosIbcByCargaId(carga.id);
  if (pedidosIbc.length === 0) {
    throw new AppError({
      message: `Carga ${codCar} não tem pedidos IBC registrados no fechamento`,
      statusCode: 409,
      code: "IBC_CARGA_SEM_FOTO_EXPEDICAO",
      details: { codCar },
    });
  }

  return { carga, pedidosIbc };
}
