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
    const cargas = await this.repository.listCargasAbertaOuFechada();

    const items: CargaExpedicaoListItem[] = [];
    for (const carga of cargas) {
      const [pedidos, alocacoes, expedicao] = await Promise.all([
        this.repository.getPedidosByCarga(carga.codCar),
        this.repository.listAlocacoesByCargaId(carga.id),
        this.repository.findExpedicaoByCargaId(carga.id),
      ]);

      items.push(
        summarizeCargaExpedicao({
          carga,
          pedidos,
          alocacoes,
          expedicao,
        }),
      );
    }

    return { cargas: items };
  }
}
