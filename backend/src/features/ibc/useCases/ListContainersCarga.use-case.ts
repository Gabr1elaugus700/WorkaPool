import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import {
  carregarCompatibilidadeDePedidos,
  GruposConfiguradosLookup,
} from "../services/carregarCompatibilidadeDePedidos";
import { isIbcCompativelComGrupos } from "../services/isIbcCompativelComGrupos";
import {
  IbcPaletaFonte,
  PlacaGrupoPaleta,
} from "../types/IbcExpedicao.types";
import { isDataLimiteDue } from "../utils/ibcDataLimite";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type ContainerPaletaDTO = {
  identificador: string;
  alocacaoId: string | null;
  grupoCodigo: string | null;
  corHex: string | null;
  universal: boolean;
  homologado: boolean;
};

export type ContainersCargaDTO = {
  grupos: PlacaGrupoPaleta[];
  vinculados: ContainerPaletaDTO[];
  disponiveis: ContainerPaletaDTO[];
};

export type PlacasDaCargaLookup = GruposConfiguradosLookup & {
  listPlacas(grupos: readonly string[]): Promise<readonly PlacaGrupoPaleta[]>;
};

function paraDto(ibc: IbcPaletaFonte, alocacaoId: string | null): ContainerPaletaDTO {
  return {
    identificador: ibc.identificador,
    alocacaoId,
    grupoCodigo: ibc.grupoCodigo,
    corHex: ibc.corHex,
    universal: ibc.universal,
    homologado: ibc.homologado,
  };
}

function disponivel(ibc: IbcPaletaFonte, grupos: readonly string[], agora: Date): boolean {
  if (ibc.convertedToContainerId != null) return false;
  if (ibc.alocacaoAberta != null) return false;
  if (ibc.aptidao !== "APTO") return false;
  if (ibc.custodia !== "PATIO") return false;
  if (ibc.dataLimite != null && isDataLimiteDue(ibc.dataLimite, agora)) return false;
  return isIbcCompativelComGrupos(ibc, grupos);
}

export class ListContainersCargaUseCase {
  constructor(
    private readonly expedicao?: Pick<
      IIbcExpedicaoRepository,
      "getCargaByCodCar" | "listPedidosIbcByCargaId" | "listIbcsParaPaleta"
    >,
    private readonly placas?: PlacasDaCargaLookup,
    private readonly agora: Date = new Date(),
  ) {}

  private expedicaoRepo(): Pick<
    IIbcExpedicaoRepository,
    "getCargaByCodCar" | "listPedidosIbcByCargaId" | "listIbcsParaPaleta"
  > {
    if (this.expedicao) return this.expedicao;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcExpedicaoRepository } = require("../repositories/IbcExpedicaoRepository") as {
      IbcExpedicaoRepository: new () => IIbcExpedicaoRepository;
    };
    return new IbcExpedicaoRepository();
  }

  private placasRepo(): PlacasDaCargaLookup {
    if (this.placas) return this.placas;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IbcProdutoRepository } = require("../repositories/IbcProdutoRepository") as {
      IbcProdutoRepository: new () => {
        listGruposConfigurados(grupos: readonly string[]): Promise<string[]>;
        listPlacasDeGrupos(grupos: readonly string[]): Promise<PlacaGrupoPaleta[]>;
      };
    };
    const repo = new IbcProdutoRepository();
    return {
      listGruposConfigurados: (grupos) => repo.listGruposConfigurados(grupos),
      listPlacas: (grupos) => repo.listPlacasDeGrupos(grupos),
    };
  }

  async execute(codCar: number): Promise<ContainersCargaDTO> {
    const expedicao = this.expedicaoRepo();
    const placas = this.placasRepo();
    const { carga, pedidosIbc } = await loadCargaFotoExpedicao(expedicao, codCar);
    const compat = await carregarCompatibilidadeDePedidos(pedidosIbc, placas);
    const ibcs = await expedicao.listIbcsParaPaleta();

    const vinculados: ContainerPaletaDTO[] = [];
    const disponiveis: ContainerPaletaDTO[] = [];
    for (const ibc of ibcs) {
      if (ibc.alocacaoAberta?.cargaId === carga.id) {
        vinculados.push(paraDto(ibc, ibc.alocacaoAberta.id));
        continue;
      }
      if (disponivel(ibc, compat.gruposPermitidos, this.agora)) {
        disponiveis.push(paraDto(ibc, null));
      }
    }

    const placasDosGrupos = await placas.listPlacas(compat.gruposPermitidos);
    const porCodigo = new Map(placasDosGrupos.map((placa) => [placa.grupoCodigo, placa]));
    const grupos = compat.gruposPermitidos.flatMap((codigo) => {
      const placa = porCodigo.get(codigo);
      return placa ? [placa] : [];
    });

    return { grupos, vinculados, disponiveis };
  }
}
