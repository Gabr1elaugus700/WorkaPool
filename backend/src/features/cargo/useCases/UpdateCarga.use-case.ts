import { Carga, SituacaoCarga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";
import { CreateCargaDTO } from "../http/schemas/cargoSchema";

export class UpdateCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}

  async execute(id: string, payload: CreateCargaDTO): Promise<Carga> {
    const carga = await this.cargoRepository.getCargaById(id);
    if (!carga) {
      throw new Error(`Carga ${id} não encontrada.`);
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