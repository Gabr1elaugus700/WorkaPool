import { comparePedidosOrdemEntrega } from "./comparePedidosOrdemEntrega";
import { isPedidoIbcElegivel } from "./isPedidoIbcElegivel";
import {
  AlocacaoIbcRecord,
  CargaExpedicaoRef,
  CargaPedidoIbcSnapshot,
  ExpedicaoIbcRecord,
} from "../types/IbcExpedicao.types";

export type RelatorioViagemIbc = {
  identificador: string;
};

export type RelatorioViagemBloco = {
  codCli: string | null;
  cliente: string;
  numPed: string;
  quantidadeEsperada: number;
  incluso: boolean;
  checklist: RelatorioViagemIbc[];
};

export type RelatorioViagem = {
  codCar: number;
  fechadoEm: Date;
  destino: string;
  placa: string | null;
  totalIbcs: number;
  totalClientes: number;
  blocos: RelatorioViagemBloco[];
};

export type MontarRelatorioViagemInput = {
  carga: CargaExpedicaoRef;
  expedicao: ExpedicaoIbcRecord;
  pedidos: CargaPedidoIbcSnapshot[];
  alocacoes: AlocacaoIbcRecord[];
  placa: string | null;
};

/** Pedido misto (venda e empréstimo) e pedido inválido ficam fora do papel. */
function pedidoViraBloco(pedido: CargaPedidoIbcSnapshot): boolean {
  if (!isPedidoIbcElegivel(pedido)) return false;
  const venda = pedido.quantidadeEsperadaVenda > 0;
  const emprestimo = pedido.quantidadeEsperadaEmprestimo > 0;
  return venda !== emprestimo;
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

function chaveCliente(bloco: Pick<RelatorioViagemBloco, "codCli" | "cliente">): string {
  return `${bloco.codCli ?? ""}\u0000${bloco.cliente}`;
}

export function montarRelatorioViagem(
  input: MontarRelatorioViagemInput,
): RelatorioViagem {
  const checklist = checklistDaCarga(input.alocacoes);
  const blocos = input.pedidos.filter(pedidoViraBloco).sort(comparePedidosOrdemEntrega).map(
    (pedido): RelatorioViagemBloco => ({
      codCli: pedido.codCli,
      cliente: pedido.cliente,
      numPed: pedido.numPed,
      quantidadeEsperada: pedido.quantidadeEsperadaTotal,
      incluso: pedido.quantidadeEsperadaVenda > 0,
      checklist,
    }),
  );

  return {
    codCar: input.carga.codCar,
    fechadoEm: input.expedicao.fechadoEm,
    destino: input.carga.destino,
    placa: input.placa,
    totalIbcs: checklist.length,
    totalClientes: new Set(blocos.map(chaveCliente)).size,
    blocos,
  };
}
