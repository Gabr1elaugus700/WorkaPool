import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  CargaExpedicaoListItem,
  summarizeCargaExpedicao,
} from "../services/summarizeCargaExpedicao";

export type ListCargasExpedicaoResult = {
  cargas: CargaExpedicaoListItem[];
};

export class ListCargasExpedicaoUseCase {
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

  async execute(): Promise<ListCargasExpedicaoResult> {
    const cargas = await this.repository.listCargasPendentesExpedicao();

    return {
      cargas: cargas.map(({ pedidosIbc, alocacoes, ...carga }) =>
        summarizeCargaExpedicao({
          carga,
          pedidos: pedidosIbc,
          alocacoes,
          expedicao: null,
        }),
      ),
    };
  }
}
