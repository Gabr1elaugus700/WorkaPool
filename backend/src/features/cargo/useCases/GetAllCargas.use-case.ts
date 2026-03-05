import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { toCargaComPesoDTO } from "../http/schemas/cargoSchema";
import { SituacaoCarga } from "../entities/Carga";

export class GetAllCargasUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(situacao?: SituacaoCarga) {
    const cargas = situacao
      ? await this.cargoRepository.listarPorSituacao(situacao)
      : await this.cargoRepository.listarTodas();

    // Para cada carga, buscar pedidos e calcular peso total
    const cargasComPeso = await Promise.all(
      cargas.map(async (carga) => {
        const pedidos = await this.cargoRepository.getPedidosPorCarga(
          carga.codCar,
        );
        return toCargaComPesoDTO(carga, pedidos);
      }),
    );

    return cargasComPeso;
  }
}
