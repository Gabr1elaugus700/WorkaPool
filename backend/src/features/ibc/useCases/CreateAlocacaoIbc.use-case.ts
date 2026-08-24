import { PedidoCargo } from "../../pedidos/types/PedidoCargo.types";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  AlocacaoIbcRecord,
} from "../types/IbcExpedicao.types";
import { AppError } from "../../../utils/AppError";

export type CreateAlocacaoIbcInput = {
  codCar: number;
  numPed: string;
  identificador: string;
  alocadoPorId: string;
};

export type CreateAlocacaoIbcResult = {
  alocacao: AlocacaoIbcRecord;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
};

const SITUACOES_PREPARACAO = new Set(["ABERTA", "FECHADA"]);

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
    const { codCar, numPed, identificador, alocadoPorId } = input;

    if (codCar == null) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "IBC_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }

    if (!numPed?.trim()) {
      throw new AppError({
        message: "Número do pedido é obrigatório",
        statusCode: 400,
        code: "IBC_NUM_PED_REQUIRED",
        details: { numPed },
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

    const carga = await this.repository.getCargaByCodCar(codCar);
    if (!carga) {
      throw new AppError({
        message: `Carga ${codCar} não encontrada`,
        statusCode: 404,
        code: "IBC_CARGA_NOT_FOUND",
        details: { codCar },
      });
    }

    if (!SITUACOES_PREPARACAO.has(carga.situacao)) {
      throw new AppError({
        message: `Carga ${codCar} não está ABERTA nem FECHADA para preparação`,
        statusCode: 409,
        code: "IBC_CARGA_SITUACAO_INVALIDA",
        details: { codCar, situacao: carga.situacao },
      });
    }

    const ibc = await this.repository.findIbcByIdentificador(identificador.trim());
    if (!ibc) {
      throw new AppError({
        message: `IBC ${identificador} não encontrado`,
        statusCode: 404,
        code: "IBC_NOT_FOUND",
        details: { identificador },
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

    if (ibc.custodia === "EM_VIAGEM") {
      throw new AppError({
        message: `IBC ${identificador} já está Em viagem`,
        statusCode: 409,
        code: "IBC_EM_VIAGEM",
        details: { identificador, custodia: ibc.custodia },
      });
    }

    const alocacaoExistente = await this.repository.findAlocacaoByIbcId(ibc.id);
    if (alocacaoExistente) {
      throw new AppError({
        message: `IBC ${identificador} já está alocado em outra carga`,
        statusCode: 409,
        code: "IBC_JA_ALOCADO",
        details: {
          identificador,
          cargaId: alocacaoExistente.cargaId,
          alocacaoId: alocacaoExistente.id,
        },
      });
    }

    const pedidos = await this.repository.getPedidosByCarga(codCar);
    const pedido = this.findPedido(pedidos, numPed);
    if (!pedido) {
      throw new AppError({
        message: `Pedido ${numPed} não encontrado na carga ${codCar}`,
        statusCode: 404,
        code: "IBC_PEDIDO_NOT_FOUND",
        details: { codCar, numPed },
      });
    }

    if (pedido.ibcInvalido) {
      throw new AppError({
        message: `Pedido ${numPed} é Pedido IBC inválido e não pode receber alocação`,
        statusCode: 409,
        code: "IBC_PEDIDO_INVALIDO",
        details: { numPed, ibcInvalido: true },
      });
    }

    if (!pedido.isContainer || pedido.quantidadeEsperadaTotal <= 0) {
      throw new AppError({
        message: `Pedido ${numPed} não é elegível para IBC nesta carga`,
        statusCode: 409,
        code: "IBC_PEDIDO_NAO_CONTAINER",
        details: { numPed, isContainer: pedido.isContainer },
      });
    }

    const quantidadeAtual = await this.repository.countAlocacoesByCargaAndNumPed(
      carga.id,
      String(pedido.numPed),
    );

    if (quantidadeAtual >= pedido.quantidadeEsperadaTotal) {
      throw new AppError({
        message: `Pedido ${numPed} já atingiu a quantidade esperada de IBC (${pedido.quantidadeEsperadaTotal})`,
        statusCode: 409,
        code: "IBC_QUANTIDADE_EXCEDIDA",
        details: {
          numPed,
          quantidadeAlocada: quantidadeAtual,
          quantidadeEsperadaTotal: pedido.quantidadeEsperadaTotal,
        },
      });
    }

    const alocacao = await this.repository.createAlocacao({
      ibcId: ibc.id,
      cargaId: carga.id,
      numPed: String(pedido.numPed),
      alocadoPorId,
    });

    return {
      alocacao,
      quantidadeAlocada: quantidadeAtual + 1,
      quantidadeEsperadaTotal: pedido.quantidadeEsperadaTotal,
    };
  }

  private findPedido(
    pedidos: PedidoCargo[],
    numPed: string,
  ): PedidoCargo | undefined {
    const target = String(numPed).trim();
    return pedidos.find((p) => String(p.numPed) === target);
  }
}
