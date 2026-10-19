import { CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";
import { comparePedidosOrdemEntrega } from "./comparePedidosOrdemEntrega";
import { isPedidoIbcElegivel } from "./isPedidoIbcElegivel";
import { pedidosNaSomaDaCarga } from "./pedidosNaSomaDaCarga";

export type DestinoConciliacaoIbc = "FICOU" | "RETORNOU" | "TROCA";
export type ModalidadeConciliacaoIbc = "VENDA" | "EMPRESTIMO";

export type ClienteConciliacao = {
  chaveCliente: string;
  codCli: string | null;
  cliente: string;
};

const PRAZO_DIAS = 90;

function vencimento(iniciadoEm: Date): Date {
  const due = new Date(iniciadoEm.getTime());
  due.setUTCDate(due.getUTCDate() + PRAZO_DIAS);
  return due;
}

function chaveCliente(codCli: string | null, cliente: string): string {
  return `${codCli ?? ""}\u0000${cliente}`;
}

function sugerirModalidade(venda: number, emprestimo: number): ModalidadeConciliacaoIbc | null {
  if (venda > 0 && emprestimo === 0) return "VENDA";
  if (emprestimo > 0 && venda === 0) return "EMPRESTIMO";
  return null;
}

export type RecusaApontamento = "MODALIDADE" | "PEDIDO" | "FORA";

export type ApontamentoResolvido =
  | { ok: true; numPed: string | null; modalidade: ModalidadeConciliacaoIbc | null }
  | { ok: false; motivo: RecusaApontamento };

export type PedidoConciliacaoViagem = {
  numPed: string;
  codCli: string | null;
  cliente: string;
  quantidadeEsperada: number;
  quantidadeApontada: number;
};

export type PedidoNaVolta = {
  exibido: string | null;
  apontado: string | null;
};

function clientes(pedidos: readonly CargaPedidoIbcSnapshot[]): ClienteConciliacao[] {
  const grupos = new Map<string, ClienteConciliacao & { posCar: number | null; numPed: string }>();
  for (const pedido of pedidos) {
    if (!isPedidoIbcElegivel(pedido)) continue;
    const chave = chaveCliente(pedido.codCli, pedido.cliente);
    if (grupos.has(chave)) continue;
    grupos.set(chave, {
      chaveCliente: chave,
      codCli: pedido.codCli,
      cliente: pedido.cliente,
      posCar: pedido.posCar,
      numPed: pedido.numPed,
    });
  }
  return [...grupos.values()].sort(comparePedidosOrdemEntrega).map(({ chaveCliente: chave, codCli, cliente }) => ({
    chaveCliente: chave,
    codCli,
    cliente,
  }));
}

function resolverApontamento(input: {
  destino: DestinoConciliacaoIbc;
  numPed: string | null;
  modalidade: ModalidadeConciliacaoIbc | null;
  pedido: CargaPedidoIbcSnapshot | null;
}): ApontamentoResolvido {
  if (input.modalidade != null) return { ok: false, motivo: "MODALIDADE" };
  if (input.destino === "RETORNOU") {
    return input.numPed == null
      ? { ok: true, numPed: null, modalidade: null }
      : { ok: false, motivo: "PEDIDO" };
  }
  if (input.numPed == null) return { ok: false, motivo: "PEDIDO" };
  if (input.pedido == null) return { ok: false, motivo: "FORA" };
  const modalidade = pedidosNaSomaDaCarga([input.pedido]).length === 1
    ? sugerirModalidade(input.pedido.quantidadeEsperadaVenda, input.pedido.quantidadeEsperadaEmprestimo)
    : null;
  return modalidade
    ? { ok: true, numPed: input.numPed, modalidade }
    : { ok: false, motivo: "PEDIDO" };
}

function pedidoNaVolta(input: {
  viagemFechada: boolean;
  destino: DestinoConciliacaoIbc | null;
  numPedAlocacao: string | null;
  numPedMarca: string | null;
}): PedidoNaVolta {
  const noCliente = input.destino === "FICOU" || input.destino === "TROCA";
  if (input.viagemFechada) {
    return { exibido: input.numPedAlocacao, apontado: noCliente ? input.numPedAlocacao : null };
  }
  const escolhido = noCliente ? input.numPedMarca : null;
  return { exibido: escolhido, apontado: escolhido };
}

function progressoPedidos(
  pedidos: readonly CargaPedidoIbcSnapshot[],
  apontados: readonly (string | null)[],
): PedidoConciliacaoViagem[] {
  const contagem = new Map<string, number>();
  for (const numPed of apontados) {
    if (numPed == null) continue;
    contagem.set(numPed, (contagem.get(numPed) ?? 0) + 1);
  }
  return pedidosNaSomaDaCarga(pedidos).slice().sort(comparePedidosOrdemEntrega).map((pedido) => ({
    numPed: pedido.numPed,
    codCli: pedido.codCli,
    cliente: pedido.cliente,
    quantidadeEsperada: pedido.quantidadeEsperadaTotal,
    quantidadeApontada: contagem.get(pedido.numPed) ?? 0,
  }));
}

export const conciliacaoViagem = {
  prazoDias: PRAZO_DIAS,
  vencimento,
  chaveCliente,
  sugerirModalidade,
  resolverApontamento,
  pedidoNaVolta,
  progressoPedidos,
  clientes,
};
