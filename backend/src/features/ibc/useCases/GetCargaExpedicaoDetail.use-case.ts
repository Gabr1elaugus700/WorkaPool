import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { AlocacaoIbcRecord } from "../types/IbcExpedicao.types";
import { isPedidoIbcElegivel } from "../services/isPedidoIbcElegivel";
import { summarizeCargaExpedicao } from "../services/summarizeCargaExpedicao";
import { AppError } from "../../../utils/AppError";

export type GetCargaExpedicaoDetailInput = {
  codCar: number;
};

export type PedidoExpedicaoDetail = {
  numPed: string;
  cliente: string;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  quantidadeEsperadaVenda: number;
  quantidadeEsperadaEmprestimo: number;
  ibcInvalido: boolean;
  alocacoes: AlocacaoIbcRecord[];
};

export type CargaExpedicaoDetail = {
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
  pedidos: PedidoExpedicaoDetail[];
};

export class GetCargaExpedicaoDetailUseCase {
  private readonly repository: IIbcExpedicaoRepository;

  constructor(repository?: IIbcExpedicaoRepository) {
    this.repository = repository ?? this.createDefaultRepository();
  }

  private createDefaultRepository(): IIbcExpedicaoRepository {
    // Lazy-load para evitar side effects de conexão SQL em testes unitários.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcExpedicaoRepository } = require("../repositories/IbcExpedicaoRepository");
    return new IbcExpedicaoRepository();
  }

  async execute(
    input: GetCargaExpedicaoDetailInput,
  ): Promise<CargaExpedicaoDetail> {
    const { codCar } = input;

    if (codCar == null || Number.isNaN(Number(codCar))) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "IBC_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }

    const carga = await this.repository.getCargaByCodCar(Number(codCar));
    if (!carga) {
      throw new AppError({
        message: `Carga ${codCar} não encontrada`,
        statusCode: 404,
        code: "IBC_CARGA_NOT_FOUND",
        details: { codCar },
      });
    }

    const [pedidos, alocacoes, expedicao] = await Promise.all([
      this.repository.getPedidosByCarga(carga.codCar),
      this.repository.listAlocacoesByCargaId(carga.id),
      this.repository.findExpedicaoByCargaId(carga.id),
    ]);

    const summary = summarizeCargaExpedicao({
      carga,
      pedidos,
      alocacoes,
      expedicao,
    });

    const pedidosDetalhe: PedidoExpedicaoDetail[] = [];
    for (const pedido of pedidos) {
      const isElegivel = isPedidoIbcElegivel(pedido);
      const showInvalidAlert = pedido.ibcInvalido;

      if (!isElegivel && !showInvalidAlert) {
        continue;
      }

      const alocacoesPedido = alocacoes.filter(
        (a) => String(a.numPed) === String(pedido.numPed),
      );

      pedidosDetalhe.push({
        numPed: String(pedido.numPed),
        cliente: pedido.cliente,
        quantidadeAlocada: alocacoesPedido.length,
        quantidadeEsperadaTotal: pedido.quantidadeEsperadaTotal,
        quantidadeEsperadaVenda: pedido.quantidadeEsperadaVenda,
        quantidadeEsperadaEmprestimo: pedido.quantidadeEsperadaEmprestimo,
        ibcInvalido: pedido.ibcInvalido,
        alocacoes: alocacoesPedido,
      });
    }

    return {
      ...summary,
      pedidos: pedidosDetalhe,
    };
  }
}
