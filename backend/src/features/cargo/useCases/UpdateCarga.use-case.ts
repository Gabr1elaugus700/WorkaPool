import { Carga, SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { CreateCargaDTO } from "../http/schemas/cargoSchema";
import { AppError } from "../../../utils/AppError";

export class UpdateCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}

  async execute(id: string, payload: CreateCargaDTO): Promise<Carga> {
    const carga = await this.cargoRepository.getCargaById(id);
    if (!carga) {
      throw new AppError({
        message: `Carga ${id} não encontrada.`,
        statusCode: 404,
        code: "CARGO_NOT_FOUND",
        details: { id },
      });
    }

    carga.destino = payload.destino;
    carga.pesoMaximo = payload.pesoMax;
    carga.previsaoSaida = new Date(payload.previsaoSaida);
    if (payload.situacao) {
      carga.situacao = payload.situacao as SituacaoCarga;
    }

    return this.cargoRepository.updateCarga(id, carga);
  }
}