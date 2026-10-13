import { comparePedidosOrdemEntrega } from "./comparePedidosOrdemEntrega";
import { isPedidoIbcElegivel } from "./isPedidoIbcElegivel";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  ExpedicaoIbcRecord,
} from "../types/IbcExpedicao.types";

export type ModalidadeRelatorioViagem =
  | "Embalagem Inclusa (Venda)"
  | "Empréstimo";

export type RelatorioViagemPedido = {
  numPed: string;
  quantidade: number;
  modalidade: ModalidadeRelatorioViagem;
};

export type RelatorioViagemIbc = {
  identificador: string;
};

export type RelatorioViagemCliente = {
  codCli: string | null;
  cliente: string;
  pedidos: RelatorioViagemPedido[];
  checklist: RelatorioViagemIbc[];
};

export type RelatorioViagem = {
  codCar: number;
  fechadoEm: Date;
  destino: string;
  placa: string | null;
  totalIbcs: number;
  totalClientes: number;
  clientes: RelatorioViagemCliente[];
};

export type MontarRelatorioViagemInput = {
  carga: CargaExpedicaoRef;
  expedicao: ExpedicaoIbcRecord;
  pedidos: CargaPedidoIbcSnapshot[];
  alocacoes: AlocacaoIbcRecord[];
  placa: string | null;
};

type ClienteGrupo = {
  codCli: string | null;
  cliente: string;
  pedidos: CargaPedidoIbcSnapshot[];
};

function chaveCliente(pedido: CargaPedidoIbcSnapshot): string {
  return `${pedido.codCli ?? ""}\u0000${pedido.cliente}`;
}

function ordemDoCliente(pedidos: CargaPedidoIbcSnapshot[]) {
  const [primeiro] = pedidos.slice().sort(comparePedidosOrdemEntrega);
  return { posCar: primeiro.posCar, numPed: primeiro.numPed };
}

function agruparClientes(pedidos: CargaPedidoIbcSnapshot[]): ClienteGrupo[] {
  const grupos = new Map<string, ClienteGrupo>();
  for (const pedido of pedidos) {
    if (!isPedidoIbcElegivel(pedido)) continue;
    const chave = chaveCliente(pedido);
    const grupo = grupos.get(chave);
    if (grupo) {
      grupo.pedidos.push(pedido);
    } else {
      grupos.set(chave, {
        codCli: pedido.codCli,
        cliente: pedido.cliente,
        pedidos: [pedido],
      });
    }
  }

  return [...grupos.values()].sort((a, b) =>
    comparePedidosOrdemEntrega(
      ordemDoCliente(a.pedidos),
      ordemDoCliente(b.pedidos),
    ),
  );
}

function linhasDoPedido(pedido: CargaPedidoIbcSnapshot): RelatorioViagemPedido[] {
  const linhas: RelatorioViagemPedido[] = [];
  if (pedido.quantidadeEsperadaVenda > 0) {
    linhas.push({
      numPed: pedido.numPed,
      quantidade: pedido.quantidadeEsperadaVenda,
      modalidade: "Embalagem Inclusa (Venda)",
    });
  }
  if (pedido.quantidadeEsperadaEmprestimo > 0) {
    linhas.push({
      numPed: pedido.numPed,
      quantidade: pedido.quantidadeEsperadaEmprestimo,
      modalidade: "Empréstimo",
    });
  }
  return linhas;
}

function compararNumPed(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

function checklistDaCarga(alocacoes: AlocacaoIbcRecord[]): RelatorioViagemIbc[] {
  const identificadores = new Set<string>();
  for (const alocacao of alocacoes) {
    const identificador = alocacao.identificador.trim();
    if (identificador.length > 0) identificadores.add(identificador);
  }
  return [...identificadores]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((identificador) => ({ identificador }));
}

export function montarRelatorioViagem(
  input: MontarRelatorioViagemInput,
): RelatorioViagem {
  const checklist = checklistDaCarga(input.alocacoes);
  const clientes = agruparClientes(input.pedidos).map((grupo) => ({
    codCli: grupo.codCli,
    cliente: grupo.cliente,
    pedidos: grupo.pedidos
      .slice()
      .sort((a, b) => compararNumPed(a.numPed, b.numPed))
      .flatMap(linhasDoPedido),
    checklist,
  }));

  return {
    codCar: input.carga.codCar,
    fechadoEm: input.expedicao.fechadoEm,
    destino: input.carga.destino,
    placa: input.placa,
    totalIbcs: checklist.length,
    totalClientes: clientes.length,
    clientes,
  };
}
