import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { pedidosNaSomaDaCarga } from "../services/pedidosNaSomaDaCarga";
import { ExpedicaoIbcRecord } from "../types/IbcExpedicao.types";
import { AppError } from "../../../utils/AppError";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

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

    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(
      this.repository,
      codCar,
    );

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

    const pedidosElegiveis = pedidosNaSomaDaCarga(pedidosIbc);

    if (pedidosElegiveis.length === 0) {
      throw new AppError({
        message: `Carga ${codCar} não possui pedidos elegíveis para IBC`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_SEM_PEDIDOS",
        details: { codCar },
      });
    }

    const quantidadeEsperadaTotal = pedidosElegiveis.reduce(
      (sum, pedido) => sum + pedido.quantidadeEsperadaTotal,
      0,
    );
    const alocacoes = await this.repository.listAlocacoesByCargaId(carga.id);
    if (alocacoes.length !== quantidadeEsperadaTotal) {
      throw new AppError({
        message: `Carga ${codCar} tem ${alocacoes.length} IBC(s) e a soma elegível é ${quantidadeEsperadaTotal}`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_TOTAL_DIVERGENTE",
        details: {
          codCar,
          quantidadeAlocada: alocacoes.length,
          quantidadeEsperadaTotal,
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
}
