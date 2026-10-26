import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  carregarCompatibilidadeDePedidos,
  GruposConfiguradosLookup,
} from "../services/carregarCompatibilidadeDePedidos";
import { createGruposConfiguradosLookup } from "../services/createGruposConfiguradosLookup";
import { isHomologadoPrefixo, resolveIbcPrefixo } from "../services/getIbcIdentifierPrefix";
import { isIbcCompativelComGrupos } from "../services/isIbcCompativelComGrupos";
import { IbcPlacaRecord } from "../types/IbcExpedicao.types";
import { isDataLimiteDue } from "../utils/ibcDataLimite";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type ContainerCarga = {
  ibcId: string;
  identificador: string;
  grupoCodigo: string | null;
  sigla: string | null;
  corHex: string | null;
  universal: boolean;
  homologado: boolean;
  alocacaoId: string | null;
};

export type ContainersCarga = {
  gruposPermitidos: { grupoCodigo: string; sigla: string | null; corHex: string | null }[];
  itens: ContainerCarga[];
};

function toContainer(placa: IbcPlacaRecord, alocacaoId: string | null): ContainerCarga {
  const prefixo = resolveIbcPrefixo(placa);
  return {
    ibcId: placa.id,
    identificador: placa.identificador,
    grupoCodigo: placa.grupoCodigo,
    sigla: placa.sigla,
    corHex: placa.corHex,
    universal: placa.universal,
    homologado: prefixo != null && isHomologadoPrefixo(prefixo),
    alocacaoId,
  };
}

/**
 * Paleta da Preparação: vinculados à carga + livres que o POST de alocação aceitaria.
 * Com a expedição fechada, só os vinculados.
 */
export class ListContainersCargaUseCase {
  private readonly repository: IIbcExpedicaoRepository;
  private grupos?: GruposConfiguradosLookup;

  constructor(repository?: IIbcExpedicaoRepository, grupos?: GruposConfiguradosLookup) {
    this.repository = repository ?? this.createDefaultRepository();
    this.grupos = grupos;
  }

  private resolveGrupos(): GruposConfiguradosLookup {
    return {
      listGruposConfigurados: (codigos) => {
        const source = this.grupos ?? createGruposConfiguradosLookup();
        this.grupos = source;
        return source.listGruposConfigurados(codigos);
      },
    };
  }

  private createDefaultRepository(): IIbcExpedicaoRepository {
    // Lazy-load para evitar side effects de conexão SQL em testes unitários.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcExpedicaoRepository } = require("../repositories/IbcExpedicaoRepository");
    return new IbcExpedicaoRepository();
  }

  async execute(input: { codCar: number }, agora: Date = new Date()): Promise<ContainersCarga> {
    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(this.repository, input.codCar);
    const [alocacoes, expedicao, compat] = await Promise.all([
      this.repository.listAlocacoesByCargaId(carga.id),
      this.repository.findExpedicaoByCargaId(carga.id),
      carregarCompatibilidadeDePedidos(pedidosIbc, this.resolveGrupos()),
    ]);

    const alocacaoPorIbc = new Map(alocacoes.map((alocacao) => [alocacao.ibcId, alocacao.id]));
    const [vinculadas, livres] = await Promise.all([
      this.repository.listPlacasPorIds([...alocacaoPorIbc.keys()]),
      expedicao ? Promise.resolve([]) : this.repository.listIbcsLivresPorGrupos(compat.gruposPermitidos),
    ]);

    const disponiveis = livres.filter(
      (placa) =>
        !alocacaoPorIbc.has(placa.id) &&
        !(placa.dataLimite != null && isDataLimiteDue(placa.dataLimite, agora)) &&
        isIbcCompativelComGrupos(placa, compat.gruposPermitidos),
    );

    const itens = [
      ...vinculadas.map((placa) => toContainer(placa, alocacaoPorIbc.get(placa.id) ?? null)),
      ...disponiveis.map((placa) => toContainer(placa, null)),
    ];

    const placaDoGrupo = new Map<string, IbcPlacaRecord>();
    for (const placa of [...vinculadas, ...disponiveis]) {
      if (placa.grupoCodigo && !placaDoGrupo.has(placa.grupoCodigo)) {
        placaDoGrupo.set(placa.grupoCodigo, placa);
      }
    }
    const gruposPermitidos = compat.gruposPermitidos.map((grupoCodigo) => {
      const placa = placaDoGrupo.get(grupoCodigo);
      return { grupoCodigo, sigla: placa?.sigla ?? null, corHex: placa?.corHex ?? null };
    });

    return { gruposPermitidos, itens };
  }
}
