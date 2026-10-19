import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { assertIbcNotReplaced } from "../services/assertIbcNotReplaced";
import { pedidosNaSomaDaCarga } from "../services/pedidosNaSomaDaCarga";
import { AlocacaoIbcRecord } from "../types/IbcExpedicao.types";
import { AppError } from "../../../utils/AppError";
import { isDataLimiteDue } from "../utils/ibcDataLimite";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type CreateAlocacaoIbcInput = {
  codCar: number;
  identificador: string;
  alocadoPorId: string;
};

export type CreateAlocacaoIbcResult = {
  alocacao: AlocacaoIbcRecord;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
};

export class CreateAlocacaoIbcUseCase {
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

  async execute(input: CreateAlocacaoIbcInput): Promise<CreateAlocacaoIbcResult> {
    const { codCar, identificador, alocadoPorId } = input;

    if (codCar == null) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "IBC_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }

    if (!identificador?.trim()) {
      throw new AppError({
        message: "Identificador do IBC é obrigatório",
        statusCode: 400,
        code: "IBC_IDENTIFICADOR_REQUIRED",
        details: { identificador },
      });
    }

    if (!alocadoPorId) {
      throw new AppError({
        message: "Usuário que aloca é obrigatório",
        statusCode: 401,
        code: "IBC_ALOCADO_POR_REQUIRED",
        details: {},
      });
    }

    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(
      this.repository,
      codCar,
    );

    const ibc = await this.repository.findIbcByIdentificador(identificador.trim());
    if (!ibc) {
      throw new AppError({
        message: `IBC ${identificador} não encontrado`,
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { identificador },
      });
    }

    assertIbcNotReplaced(ibc, "IBC_SUBSTITUIDO");

    if (ibc.custodia === "ENTRADA") {
      throw new AppError({
        message: `IBC ${identificador} está em entrada no pátio e não pode ser alocado`,
        statusCode: 409,
        code: "IBC_ENTRADA_PENDENTE",
        details: { identificador, custodia: ibc.custodia },
      });
    }

    if (ibc.custodia === "EM_VIAGEM") {
      throw new AppError({
        message: `IBC ${identificador} já está Em viagem`,
        statusCode: 409,
        code: "IBC_EM_VIAGEM",
        details: { identificador, custodia: ibc.custodia },
      });
    }

    if (ibc.custodia === "CLIENTE") {
      throw new AppError({
        message: `IBC ${identificador} está no cliente e não pode ser alocado`,
        statusCode: 409,
        code: "IBC_NO_CLIENTE",
        details: { identificador, custodia: ibc.custodia },
      });
    }

    if (ibc.dataLimite != null && isDataLimiteDue(ibc.dataLimite, new Date())) {
      await this.repository.markIbcDataLimite(ibc.id);
      throw new AppError({
        message: `IBC ${identificador} está Inapto e não pode ser alocado`,
        statusCode: 409,
        code: "IBC_INAPTO",
        details: {
          identificador,
          aptidao: "INAPTO",
          motivoInaptidao: "DATA_LIMITE",
        },
      });
    }

    if (ibc.aptidao === "INAPTO") {
      throw new AppError({
        message: `IBC ${identificador} está Inapto e não pode ser alocado`,
        statusCode: 409,
        code: "IBC_INAPTO",
        details: { identificador, aptidao: ibc.aptidao },
      });
    }

    const alocacaoExistente = await this.repository.findAlocacaoByIbcId(ibc.id);
    if (alocacaoExistente) {
      const mesmaCarga = alocacaoExistente.cargaId === carga.id;
      throw new AppError({
        message: mesmaCarga
          ? `IBC ${identificador} já está alocado nesta carga`
          : `IBC ${identificador} já está alocado em outra carga`,
        statusCode: 409,
        code: "IBC_JA_ALOCADO",
        details: {
          identificador,
          cargaId: alocacaoExistente.cargaId,
          alocacaoId: alocacaoExistente.id,
          mesmaCarga,
        },
      });
    }

    const elegiveis = pedidosNaSomaDaCarga(pedidosIbc);
    const quantidadeEsperadaTotal = elegiveis.reduce(
      (sum, pedido) => sum + pedido.quantidadeEsperadaTotal,
      0,
    );
    if (quantidadeEsperadaTotal <= 0) {
      throw new AppError({
        message: `Carga ${codCar} não possui pedidos elegíveis para IBC`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_SEM_PEDIDOS",
        details: { codCar },
      });
    }

    const alocacoes = await this.repository.listAlocacoesByCargaId(carga.id);
    if (alocacoes.length >= quantidadeEsperadaTotal) {
      throw new AppError({
        message: `Carga ${codCar} já atingiu a quantidade de IBC (${quantidadeEsperadaTotal})`,
        statusCode: 409,
        code: "IBC_QUANTIDADE_EXCEDIDA",
        details: {
          codCar,
          quantidadeAlocada: alocacoes.length,
          quantidadeEsperadaTotal,
        },
      });
    }

    const alocacao = await this.repository.createAlocacao({
      ibcId: ibc.id,
      cargaId: carga.id,
      numPed: null,
      alocadoPorId,
    });

    return {
      alocacao,
      quantidadeAlocada: alocacoes.length + 1,
      quantidadeEsperadaTotal,
    };
  }
}
