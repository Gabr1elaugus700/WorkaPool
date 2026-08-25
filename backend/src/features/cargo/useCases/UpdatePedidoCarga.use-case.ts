import { Role } from "@prisma/client";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { IPedidosRepository } from "../../pedidos/repositories/IPedidosRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { AppError } from "../../../utils/AppError";
import { cargoCapacityWeight } from "../services/cargoCapacityWeight";

const PRIVILEGED_ROLES: ReadonlySet<Role> = new Set([
  Role.ADMIN,
  Role.LOGISTICA,
  Role.GERENTE_DPTO,
]);

export class UpdatePedidoCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(
      new PedidosRepository(),
    ),
    private readonly pedidosRepository: IPedidosRepository = new PedidosRepository(),
  ) {}

  async execute(
    numPed: number,
    codCar: number,
    posCar: number,
    role: Role,
  ): Promise<void> {
    if (numPed == null || codCar == null || posCar == null) {
      throw new AppError({
        message: "Dados obrigatórios ausentes para atualizar pedido na carga",
        statusCode: 400,
        code: "CARGO_PEDIDO_DATA_REQUIRED",
        details: { numPed, codCar, posCar },
      });
    }

    if (codCar > 0) {
      await this.assertCapacityAllowsAllocation(numPed, codCar, role);
    }

    await this.cargoRepository.updatePedidoCarga(numPed, codCar, posCar);

    if (codCar > 0) {
      try {
        const { peso } = await this.pedidosRepository.getPedidoWeight(numPed);
        console.log("⚖️ [UseCase] Peso do pedido obtido:", peso);

        const carga = await this.cargoRepository.getCargaByCodCar(codCar);
        if (!carga) {
          console.error("❌ [UseCase] Carga não encontrada:", codCar);
          throw new AppError({
            message: `Carga ${codCar} não encontrada`,
            statusCode: 404,
            code: "CARGO_NOT_FOUND",
            details: { codCar },
          });
        }

        await this.pedidosRepository.createHistoricoPeso(
          numPed,
          carga.id,
          peso,
        );
      } catch (error) {
        console.error("❌ [UseCase] Erro ao salvar histórico de peso:", error);
      }
    }
  }

  private async assertCapacityAllowsAllocation(
    numPed: number,
    codCar: number,
    role: Role,
  ): Promise<void> {
    if (PRIVILEGED_ROLES.has(role)) {
      return;
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

    const pedidosNaCarga = await this.cargoRepository.getPedidosPorCarga(codCar);
    const pedidosSemAlvo = pedidosNaCarga.filter(
      (pedido) => Number(pedido.numPed) !== numPed,
    );
    const pesoOcupado =
      cargoCapacityWeight.occupiedFromPedidos(pedidosSemAlvo);
    const { peso: pesoPedido } =
      await this.pedidosRepository.getPedidoWeight(numPed);
    const pesoTotal = pesoOcupado + pesoPedido;

    if (pesoTotal > carga.pesoMaximo) {
      throw new AppError({
        message: `Capacidade da carga ${codCar} excedida`,
        statusCode: 422,
        code: "CARGO_CAPACIDADE_EXCEDIDA",
        details: {
          codCar,
          pesoPedido,
          pesoOcupado,
          pesoMaximo: carga.pesoMaximo,
          excesso: pesoTotal - carga.pesoMaximo,
        },
      });
    }
  }
}
