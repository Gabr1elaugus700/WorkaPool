import { ICargoRepository } from "../repositories/ICargoRepository";
import { CargoRepository } from "../repositories/CargoRepository";
import { Carga, SituacaoCarga } from "../entities/Carga";
import { CargaResponseDTO, CreateCargaDTO, toCargaResponseDTO } from "../http/schemas/cargoSchema";
import { NewNumberCargoUseCase } from "./NewNumberCargo.use-case";

export class CreateCargaUseCase {
  constructor(
    private readonly cargoRepository: ICargoRepository = new CargoRepository(),
  ) {}

  async execute(input: CreateCargaDTO): Promise<CargaResponseDTO> {

    const newNumberCargoUseCase = new NewNumberCargoUseCase(this.cargoRepository);
    const codCar = await newNumberCargoUseCase.execute();

    const carga = new Carga({
      codCar: codCar, 
      destino: input.destino,
      pesoMaximo: input.pesoMax,
      previsaoSaida: new Date(input.previsaoSaida),
      situacao: (input.situacao ?? SituacaoCarga.ABERTA) as SituacaoCarga,
    });

    const criada = await this.cargoRepository.createCarga(carga);
    return toCargaResponseDTO(criada);
  }
}
