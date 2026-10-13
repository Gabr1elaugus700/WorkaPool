import { CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";
import { comparePedidosOrdemEntrega } from "./comparePedidosOrdemEntrega";
import { isPedidoIbcElegivel } from "./isPedidoIbcElegivel";

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

export type MarcaNormalizada =
  | { ok: true; modalidade: ModalidadeConciliacaoIbc | null }
  | { ok: false };

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

function modalidadeDaMarca(
  destino: DestinoConciliacaoIbc,
  modalidade: ModalidadeConciliacaoIbc | null,
): MarcaNormalizada {
  const valida = modalidade === "VENDA" || modalidade === "EMPRESTIMO";
  if (destino === "FICOU") return valida ? { ok: true, modalidade } : { ok: false };
  return modalidade == null ? { ok: true, modalidade: null } : { ok: false };
}

export const conciliacaoViagem = {
  prazoDias: PRAZO_DIAS,
  vencimento,
  chaveCliente,
  sugerirModalidade,
  modalidadeDaMarca,
  clientes,
};
