import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { toCargaComPesoDTO } from "../http/schemas/cargoSchema";
import { SituacaoCarga } from "../entities/Carga";

export class GetAllCargasUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(situacoes?: string[]) {
    let cargas;

    if (situacoes && situacoes.length > 0) {
      // Buscar cargas para cada situação e juntar os resultados
      const cargasPorSituacao = await Promise.all(
        situacoes.map(situacao => 
          this.cargoRepository.getCargas(situacao as SituacaoCarga)
        )
      );
      
      // Flatten o array de arrays em um único array
      cargas = cargasPorSituacao.flat();
    } else {
      // Buscar todas as cargas (sem filtro)
      cargas = await this.cargoRepository.getCargas();
    }
    
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
