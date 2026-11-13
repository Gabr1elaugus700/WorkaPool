import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  ContainerPaletaDto,
  mapContainerPaleta,
} from "../mappers/containerPaleta.mapper";
import {
  carregarCompatibilidadeDePedidos,
  GruposConfiguradosLookup,
} from "../services/carregarCompatibilidadeDePedidos";
import { createGruposConfiguradosLookup } from "../services/createGruposConfiguradosLookup";
import { isIbcCompativelComGrupos } from "../services/isIbcCompativelComGrupos";
import { AppError } from "../../../utils/AppError";
import { isDataLimiteDue } from "../utils/ibcDataLimite";
import {
  GrupoPaleta,
  IbcCandidatoPaleta,
  PlacaGrupoPaleta,
} from "../types/IbcExpedicao.types";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type ContainersCargaPaleta = {
  grupos: GrupoPaleta[];
  vinculados: ContainerPaletaDto[];
  disponiveis: ContainerPaletaDto[];
};

export type PlacasGrupoLookup = {
  listPlacasGrupos(grupos: readonly string[]): Promise<readonly PlacaGrupoPaleta[]>;
};

export type DescricoesGrupoLookup = {
  listDescricoes(
    grupos: readonly string[],
  ): Promise<readonly { grupoCodigo: string; grupoDescricao: string | null }[]>;
};

export type ListContainersCargaInput = {
  codCar: number;
};

function candidatoDisponivel(
  ibc: IbcCandidatoPaleta,
  gruposPermitidos: readonly string[],
  now: Date,
): boolean {
  if (ibc.baixadoEm != null) return false;
  if (ibc.convertedToContainerId != null) return false;
  if (ibc.custodia !== "PATIO") return false;
  if (ibc.aptidao !== "APTO") return false;
  if (ibc.dataLimite != null && isDataLimiteDue(ibc.dataLimite, now)) return false;
  return isIbcCompativelComGrupos(ibc, gruposPermitidos);
}

function descricaoDoCatalogo(valor: string | null | undefined): string | null {
  const nome = valor?.trim() ?? "";
  return nome.length > 0 ? nome : null;
}

export class ListContainersCargaUseCase {
  private readonly repository: IIbcExpedicaoRepository;
  private grupos?: GruposConfiguradosLookup;
  private readonly placas: PlacasGrupoLookup;
  private readonly now: () => Date;
  private readonly descricoes: DescricoesGrupoLookup;

  constructor(
    repository?: IIbcExpedicaoRepository,
    grupos?: GruposConfiguradosLookup,
    placas?: PlacasGrupoLookup,
    now?: () => Date,
    descricoes?: DescricoesGrupoLookup,
  ) {
    this.repository = repository ?? this.createDefaultRepository();
    this.grupos = grupos;
    this.placas = placas ?? this.createDefaultPlacas();
    this.now = now ?? (() => new Date());
    this.descricoes = descricoes ?? this.createDefaultDescricoes();
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcExpedicaoRepository } = require("../repositories/IbcExpedicaoRepository");
    return new IbcExpedicaoRepository();
  }

  private createDefaultPlacas(): PlacasGrupoLookup {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcProdutoRepository } = require("../repositories/IbcProdutoRepository");
    return new IbcProdutoRepository();
  }

  private createDefaultDescricoes(): DescricoesGrupoLookup {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ProdutoGrupoCatalogoRepository } = require("../repositories/ProdutoGrupoCatalogoRepository");
    return new ProdutoGrupoCatalogoRepository();
  }

  async execute(input: ListContainersCargaInput): Promise<ContainersCargaPaleta> {
    const { codCar } = input;
    if (codCar == null || Number.isNaN(Number(codCar))) {
      throw new AppError({
        message: "Código da carga é obrigatório",
        statusCode: 400,
        code: "IBC_COD_CAR_REQUIRED",
        details: { codCar },
      });
    }

    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(
      this.repository,
      Number(codCar),
    );

    const [vinculados, candidatos, compat] = await Promise.all([
      this.repository.listVinculadosPaleta(carga.id),
      this.repository.listCandidatosPaleta(),
      carregarCompatibilidadeDePedidos(pedidosIbc, this.resolveGrupos()),
    ]);

    const [placas, descricoes] = await Promise.all([
      this.placas.listPlacasGrupos(compat.gruposPermitidos),
      this.descricoes.listDescricoes(compat.gruposPermitidos),
    ]);
    const porCodigo = new Map(placas.map((placa) => [placa.grupoCodigo, placa]));
    const nomePorCodigo = new Map(
      descricoes.map((item) => [item.grupoCodigo, descricaoDoCatalogo(item.grupoDescricao)]),
    );
    const grupos = compat.gruposPermitidos.flatMap((codigo): GrupoPaleta[] => {
      const placa = porCodigo.get(codigo);
      if (!placa) return [];
      return [{ ...placa, grupoDescricao: nomePorCodigo.get(codigo) ?? null }];
    });

    const agora = this.now();
    return {
      grupos,
      vinculados: vinculados.map((ibc) => mapContainerPaleta(ibc, ibc.alocacaoId)),
      disponiveis: candidatos
        .filter((ibc) => candidatoDisponivel(ibc, compat.gruposPermitidos, agora))
        .map((ibc) => mapContainerPaleta(ibc, null)),
    };
  }
}
