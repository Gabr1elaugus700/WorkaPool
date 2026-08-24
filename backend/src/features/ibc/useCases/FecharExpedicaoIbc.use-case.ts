import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { ExpedicaoIbcRecord } from "../types/IbcExpedicao.types";
import { AppError } from "../../../utils/AppError";

export type FecharExpedicaoIbcInput = {
  codCar: number;
  fechadoPorId: string;
};

export type FecharExpedicaoIbcResult = {
  expedicao: ExpedicaoIbcRecord;
  ibcsEmViagem: number;
};

export class FecharExpedicaoIbcUseCase {
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
    input: FecharExpedicaoIbcInput,
  ): Promise<FecharExpedicaoIbcResult> {
    const { codCar, fechadoPorId } = input;

    if (codCar == null) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "IBC_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }

    if (!fechadoPorId) {
      throw new AppError({
        message: "Usuário que fecha a expedição é obrigatório",
        statusCode: 401,
        code: "IBC_FECHADO_POR_REQUIRED",
        details: {},
      });
    }

    const carga = await this.repository.getCargaByCodCar(codCar);
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
        message: `Carga ${codCar} precisa estar FECHADA para fechar a expedição`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_CARGA_NAO_FECHADA",
        details: { codCar, situacao: carga.situacao },
      });
    }

    const expedicaoExistente = await this.repository.findExpedicaoByCargaId(
      carga.id,
    );
    if (expedicaoExistente) {
      throw new AppError({
        message: `Carga ${codCar} já possui ExpedicaoIbc`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_JA_EXISTE",
        details: { codCar, expedicaoIbcId: expedicaoExistente.id },
      });
    }

    const pedidos = await this.repository.getPedidosByCarga(codCar);
    const pedidosElegiveis = pedidos.filter(
      (p) => p.isContainer && !p.ibcInvalido && p.quantidadeEsperadaTotal > 0,
    );

    if (pedidosElegiveis.length === 0) {
      throw new AppError({
        message: `Carga ${codCar} não possui pedidos elegíveis para IBC`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_SEM_PEDIDOS",
        details: { codCar },
      });
    }

    const alocacoes = await this.repository.listAlocacoesByCargaId(carga.id);
    const countsByNumPed = new Map<string, number>();
    for (const alocacao of alocacoes) {
      const key = String(alocacao.numPed);
      countsByNumPed.set(key, (countsByNumPed.get(key) ?? 0) + 1);
    }

    const insuficiente = this.findPedidoInsuficiente(
      pedidosElegiveis,
      countsByNumPed,
    );
    if (insuficiente) {
      const alocado = countsByNumPed.get(String(insuficiente.numPed)) ?? 0;
      throw new AppError({
        message: `Pedido ${insuficiente.numPed} está incompleto (${alocado}/${insuficiente.quantidadeEsperadaTotal} IBCs)`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_PEDIDO_INSUFICIENTE",
        details: {
          numPed: String(insuficiente.numPed),
          quantidadeAlocada: alocado,
          quantidadeEsperadaTotal: insuficiente.quantidadeEsperadaTotal,
        },
      });
    }

    const expedicao = await this.repository.fecharExpedicao({
      cargaId: carga.id,
      fechadoPorId,
      alocacaoIds: alocacoes.map((a) => a.id),
      ibcIds: alocacoes.map((a) => a.ibcId),
    });

    return {
      expedicao,
      ibcsEmViagem: alocacoes.length,
    };
  }

  private findPedidoInsuficiente(
    pedidos: PedidoCargo[],
    countsByNumPed: Map<string, number>,
  ): PedidoCargo | undefined {
    return pedidos.find((pedido) => {
      const alocado = countsByNumPed.get(String(pedido.numPed)) ?? 0;
      return alocado < pedido.quantidadeEsperadaTotal;
    });
  }
}
