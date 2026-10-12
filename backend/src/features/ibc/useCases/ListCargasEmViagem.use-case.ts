import { IIbcExpedicaoRepository } from "../repositories/IIbcExpedicaoRepository";
import { comparePedidosOrdemEntrega } from "../services/comparePedidosOrdemEntrega";
import { isPedidoIbcElegivel } from "../services/isPedidoIbcElegivel";
import { CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";

export type CargaEmViagemCliente = {
  cliente: string;
  codCli: string | null;
};

export type CargaEmViagemListItem = {
  codCar: number;
  destino: string;
  situacao: string;
  previsaoSaida: Date;
  fechadoEm: Date;
  quantidadePedidos: number;
  quantidadeIbcs: number;
  quantidadeIbcsEmViagem: number;
  clientes: CargaEmViagemCliente[];
};

export type ListCargasEmViagemResult = {
  cargas: CargaEmViagemListItem[];
};

function listClientesEmOrdemEntrega(
  pedidos: CargaPedidoIbcSnapshot[],
): CargaEmViagemCliente[] {
  const ordenados = pedidos
    .filter(isPedidoIbcElegivel)
    .slice()
    .sort(comparePedidosOrdemEntrega);
  const vistos = new Set<string>();
  const clientes: CargaEmViagemCliente[] = [];
  for (const pedido of ordenados) {
    const chave = `${pedido.codCli ?? ""}\u0000${pedido.cliente}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    clientes.push({ cliente: pedido.cliente, codCli: pedido.codCli });
  }
  return clientes;
}

export class ListCargasEmViagemUseCase {
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

  async execute(): Promise<ListCargasEmViagemResult> {
    const cargas = await this.repository.listCargasEmViagem();
    return {
      cargas: cargas.map((carga) => {
        const elegiveis = carga.pedidosIbc.filter(isPedidoIbcElegivel);
        return {
          codCar: carga.codCar,
          destino: carga.destino,
          situacao: carga.situacao,
          previsaoSaida: carga.previsaoSaida,
          fechadoEm: carga.expedicao.fechadoEm,
          quantidadePedidos: elegiveis.length,
          quantidadeIbcs: carga.alocacoes.length,
          quantidadeIbcsEmViagem: carga.alocacoes.filter(
            (alocacao) => alocacao.custodia === "EM_VIAGEM",
          ).length,
          clientes: listClientesEmOrdemEntrega(carga.pedidosIbc),
        };
      }),
    };
  }
}
