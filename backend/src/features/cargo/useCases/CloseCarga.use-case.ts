import { Role } from "@prisma/client";
import { Carga, SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { PedidoService } from "../../pedidos/services/PedidoService";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";
import {
  CargaDespachoRecord,
  CloseCargaDespachoInput,
} from "../types/CargaDespacho.types";

export type CloseCargaInput = {
  codCar: number;
  motoristaId?: string | null;
  caminhaoId?: string | null;
  fechadoPorId: string;
};

export type CloseCargaResult = {
  carga: Carga;
  pedidosSalvos: number;
  pedidosSemCargaSapiens: string[];
  despacho: CargaDespachoRecord;
};

export class CloseCargaUseCase {
  private readonly cargoRepository: ICargoRepository;
  private readonly pedidoService: PedidoService;

  constructor(
    cargoRepository?: ICargoRepository,
    pedidoService?: PedidoService,
  ) {
    this.cargoRepository = cargoRepository ?? this.createDefaultRepository();
    this.pedidoService = pedidoService ?? new PedidoService(new PedidosRepository());
  }

  private createDefaultRepository(): ICargoRepository {
    // Lazy-load para evitar side effects de conexão SQL em testes unitários.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CargoRepository } = require("../repositories/CargoRepository");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PedidosRepository: PedidosRepo } = require("../../pedidos/repositories/PedidosRepository");
    return new CargoRepository(new PedidosRepo());
  }

  async execute(input: CloseCargaInput): Promise<CloseCargaResult> {
    const { codCar, motoristaId, caminhaoId, fechadoPorId } = input;

    if (codCar == null) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "CARGO_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }

    if (!fechadoPorId) {
      throw new AppError({
        message: "Usuário que fecha a carga é obrigatório",
        statusCode: 401,
        code: "CARGO_FECHADO_POR_REQUIRED",
        details: {},
      });
    }

    if (!motoristaId || !caminhaoId) {
      throw new AppError({
        message: "Motorista e caminhão são obrigatórios para fechar a carga",
        statusCode: 400,
        code: "CARGO_DESPACHO_REQUIRED",
        details: { codCar, motoristaId, caminhaoId },
      });
    }

    const carga = await this.cargoRepository.getCargaByCodCar(codCar);
    if (!carga) {
      throw new AppError({
        message: `Carga ${codCar} não encontrada`,
        statusCode: 404,
        code: "CARGO_NOT_FOUND",
        details: { codCar },
      });
    }

    if (carga.situacao === SituacaoCarga.FECHADA) {
      throw new AppError({
        message: `Carga ${codCar} já está fechada`,
        statusCode: 409,
        code: "CARGO_JA_FECHADA",
        details: { codCar },
      });
    }

    const despachoExistente = await this.cargoRepository.findDespachoByCargaId(
      carga.id,
    );
    if (despachoExistente) {
      throw new AppError({
        message: `Carga ${codCar} já possui CargaDespacho`,
        statusCode: 409,
        code: "CARGO_JA_FECHADA",
        details: { codCar, despachoId: despachoExistente.id },
      });
    }

    const pedidos = await this.cargoRepository.getPedidosPorCarga(carga.codCar);
    if (pedidos.length === 0) {
      throw new AppError({
        message: `Carga ${codCar} não possui pedidos vinculados`,
        statusCode: 409,
        code: "CARGO_SEM_PEDIDOS_VINCULADOS",
        details: { codCar },
      });
    }

    const pedidosSemCarga: string[] = [];

    for (const pedido of pedidos) {
      const numPed = Number(pedido.numPed);
      if (!(await this.cargoRepository.validarCargaSapiens(numPed))) {
        pedidosSemCarga.push(numPed.toString());
      }
    }

    if (pedidosSemCarga.length > 0) {
      throw new AppError({
        message: `Os seguintes pedidos não estão vinculados a nenhuma carga no sistema Sapiens: ${pedidosSemCarga.join(", ")}`,
        statusCode: 409,
        code: "CARGO_PEDIDOS_FORA_DO_SAPIENS",
        details: { codCar, pedidos: pedidosSemCarga },
      });
    }

    const motorista = await this.cargoRepository.findUserById(motoristaId);
    if (!motorista || motorista.role !== Role.MOTORISTA) {
      throw new AppError({
        message: "Motorista inválido: informe um usuário com role MOTORISTA",
        statusCode: 400,
        code: "CARGO_MOTORISTA_INVALIDO",
        details: { motoristaId },
      });
    }

    const caminhao = await this.cargoRepository.findTruckById(caminhaoId);
    if (!caminhao) {
      throw new AppError({
        message: `Caminhão ${caminhaoId} não encontrado`,
        statusCode: 404,
        code: "CARGO_CAMINHAO_NAO_ENCONTRADO",
        details: { caminhaoId },
      });
    }

    const despachoInput: CloseCargaDespachoInput = {
      codCar,
      motoristaId,
      caminhaoId,
      fechadoPorId,
    };

    const resultado = await this.cargoRepository.closeCarga(despachoInput);

    return {
      ...resultado,
      pedidosSalvos: pedidos.length,
      pedidosSemCargaSapiens: pedidosSemCarga,
    };
  }
}
