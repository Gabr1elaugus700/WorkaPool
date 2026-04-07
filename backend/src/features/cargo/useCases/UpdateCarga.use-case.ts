import { Carga } from "../entities/Carga";
import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { PedidosRepository } from "../../pedidos/repositories/PedidosRepository";

export class UpdateCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(new PedidosRepository()),
  ) {}
    async execute(id: string, situacao: Carga["situacao"]): Promise<Carga> {
      const carga = await this.cargoRepository.getCargaById(id);
      if (!carga) {
        throw new Error(`Carga ${id} não encontrada.`);
      }
      carga.situacao = situacao;
      return this.cargoRepository.updateCarga(id, carga);
    }
}