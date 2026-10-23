import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { AlocacaoIbcRecord } from "../types/IbcExpedicao.types";
import {
  AvisoPedidoGrupoSemConfig,
  carregarCompatibilidadeDePedidos,
  GruposConfiguradosLookup,
} from "../services/carregarCompatibilidadeDePedidos";
import { createGruposConfiguradosLookup } from "../services/createGruposConfiguradosLookup";
import { isPedidoIbcElegivel } from "../services/isPedidoIbcElegivel";
import { summarizeCargaExpedicao } from "../services/summarizeCargaExpedicao";
import { AppError } from "../../../utils/AppError";
import { loadCargaFotoExpedicao } from "./loadCargaFotoExpedicao";

export type GetCargaExpedicaoDetailInput = {
  codCar: number;
};

export type PedidoExpedicaoDetail = {
  numPed: string;
  cliente: string;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  quantidadeEsperadaVenda: number;
  quantidadeEsperadaEmprestimo: number;
  ibcInvalido: boolean;
  alocacoes: AlocacaoIbcRecord[];
};

export type CargaExpedicaoDetail = {
  id: string;
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: Date;
  quantidadeAlocada: number;
  quantidadeEsperadaTotal: number;
  temExpedicao: boolean;
  podeFecharExpedicao: boolean;
  pedidos: PedidoExpedicaoDetail[];
  alocacoes: AlocacaoIbcRecord[];
  avisos: AvisoPedidoGrupoSemConfig[];
};

export class GetCargaExpedicaoDetailUseCase {
  private readonly repository: IIbcExpedicaoRepository;
  private grupos?: GruposConfiguradosLookup;

  constructor(
    repository?: IIbcExpedicaoRepository,
    grupos?: GruposConfiguradosLookup,
  ) {
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

  async execute(
    input: GetCargaExpedicaoDetailInput,
  ): Promise<CargaExpedicaoDetail> {
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

    const [alocacoes, expedicao, compat] = await Promise.all([
      this.repository.listAlocacoesByCargaId(carga.id),
      this.repository.findExpedicaoByCargaId(carga.id),
      carregarCompatibilidadeDePedidos(pedidosIbc, this.resolveGrupos()),
    ]);

    const summary = summarizeCargaExpedicao({
      carga,
      pedidos: pedidosIbc,
      alocacoes,
      expedicao,
    });

    const pedidos = pedidosIbc
      .filter((pedido) => isPedidoIbcElegivel(pedido) || pedido.ibcInvalido)
      .map((pedido): PedidoExpedicaoDetail => {
        const alocacoesPedido = alocacoes.filter(
          (a) => a.numPed === pedido.numPed,
        );
        return {
          numPed: pedido.numPed,
          cliente: pedido.cliente,
          quantidadeAlocada: alocacoesPedido.length,
          quantidadeEsperadaTotal: pedido.quantidadeEsperadaTotal,
          quantidadeEsperadaVenda: pedido.quantidadeEsperadaVenda,
          quantidadeEsperadaEmprestimo: pedido.quantidadeEsperadaEmprestimo,
          ibcInvalido: pedido.ibcInvalido,
          alocacoes: alocacoesPedido,
        };
      });

    return { ...summary, pedidos, alocacoes, avisos: compat.avisos };
  }
}
