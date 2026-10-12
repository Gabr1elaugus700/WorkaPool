import { AppError } from "../../../utils/AppError";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  montarRelatorioViagem,
  RelatorioViagem,
} from "../services/montarRelatorioViagem";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type GetRelatorioViagemInput = {
  codCar: number;
};

export class GetRelatorioViagemUseCase {
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

  async execute(input: GetRelatorioViagemInput): Promise<RelatorioViagem> {
    const codCar = Number(input.codCar);
    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(
      this.repository,
      codCar,
    );

    const expedicao = await this.repository.findExpedicaoByCargaId(carga.id);
    if (!expedicao) {
      throw new AppError({
        message: `Carga ${codCar} não tem expedição IBC fechada`,
        statusCode: 409,
        code: "IBC_EXPEDICAO_AUSENTE",
        details: { codCar },
      });
    }

    const [alocacoes, placa] = await Promise.all([
      this.repository.listAlocacoesByCargaId(carga.id),
      this.repository.findPlacaByCargaId(carga.id),
    ]);

    return montarRelatorioViagem({
      carga,
      expedicao,
      pedidos: pedidosIbc,
      alocacoes,
      placa,
    });
  }
}
