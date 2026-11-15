import { AppError } from "../../../utils/AppError";
import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  montarRelatorioViagem,
  RelatorioViagem,
} from "../services/montarRelatorioViagem";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

type DescricoesGrupo = {
  listDescricoes(
    grupos: readonly string[],
  ): Promise<{ grupoCodigo: string; grupoDescricao: string }[]>;
};

function primeiroNome(descricao: string): string | null {
  const nome = descricao.trim().split(/\s+/)[0] ?? "";
  return nome.length > 0 ? nome : null;
}

export type GetRelatorioViagemInput = {
  codCar: number;
};

export class GetRelatorioViagemUseCase {
  private readonly repository: IIbcExpedicaoRepository;
  private readonly descricoes: DescricoesGrupo;

  constructor(repository?: IIbcExpedicaoRepository, descricoes?: DescricoesGrupo) {
    this.repository = repository ?? this.createDefaultRepository();
    this.descricoes = descricoes ?? this.createDefaultDescricoes();
  }

  private createDefaultRepository(): IIbcExpedicaoRepository {
    // Lazy-load para evitar side effects de conexão SQL em testes unitários.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcExpedicaoRepository } = require("../repositories/IbcExpedicaoRepository");
    return new IbcExpedicaoRepository();
  }

  private createDefaultDescricoes(): DescricoesGrupo {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ProdutoGrupoCatalogoRepository } = require("../repositories/ProdutoGrupoCatalogoRepository");
    return new ProdutoGrupoCatalogoRepository();
  }

  private async produtoPorIdentificador(
    ibcIds: string[],
  ): Promise<Map<string, string>> {
    const compat = await this.repository.listCompatibilidadePorIds(ibcIds);
    const codigos = compat.flatMap((item) => (item.grupoCodigo ? [item.grupoCodigo] : []));
    const descricoes = codigos.length > 0 ? await this.descricoes.listDescricoes(codigos) : [];
    const nomePorCodigo = new Map(
      descricoes.flatMap((item) => {
        const nome = primeiroNome(item.grupoDescricao);
        return nome ? [[item.grupoCodigo, nome] as const] : [];
      }),
    );
    const porIdentificador = new Map<string, string>();
    for (const item of compat) {
      if (!item.grupoCodigo) continue;
      const nome = nomePorCodigo.get(item.grupoCodigo);
      if (nome) porIdentificador.set(item.identificador, nome);
    }
    return porIdentificador;
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
    const produtoPorIdentificador = await this.produtoPorIdentificador(
      alocacoes.map((alocacao) => alocacao.ibcId),
    );

    return montarRelatorioViagem({
      carga,
      expedicao,
      pedidos: pedidosIbc,
      alocacoes,
      placa,
      produtoPorIdentificador,
    });
  }
}
