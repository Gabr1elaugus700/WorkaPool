import { AppError } from "../../../utils/AppError";
import { MarcaConciliacaoSalva } from "../repositories/IbcConciliacaoRepository";
import { conciliacaoViagem, ModalidadeConciliacaoIbc } from "../services/conciliacaoViagem";
import { AlocacaoIbcRecord, CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";
import { pedidosNaSomaDaCarga } from "./pedidosNaSomaDaCarga";

export type EntradaNoFechamento = { ibcId: string; origem: "RETORNO" | "TROCA" };

export type EfeitoFechamentoIbc = {
  ibcId: string;
  alocacaoIbcId: string;
  custodia: "CLIENTE" | null;
  motivoBaixa: "VENDA" | "TROCA" | null;
  trocaEntradaId: string | null;
  encerrarAlocacao: boolean;
  emprestimoIniciadoEm: Date | null;
  emprestimoVenceEm: Date | null;
};

export type FicouNaViagem = {
  ibcId: string;
  identificador: string;
  modalidade: ModalidadeConciliacaoIbc;
  codCli: string | null;
  cliente: string;
  numPed: string;
};

export type PlanoFechamentoViagem = {
  entradas: EntradaNoFechamento[];
  efeitos: EfeitoFechamentoIbc[];
  ficaram: FicouNaViagem[];
};

function falha(statusCode: number, code: string, message: string, details?: unknown): never {
  throw new AppError({ statusCode, code, message, details });
}

export function planejarFechamentoViagem(input: {
  now: Date;
  alocacoes: AlocacaoIbcRecord[];
  pedidos: CargaPedidoIbcSnapshot[];
  marcas: MarcaConciliacaoSalva[];
  confirmacoes?: readonly string[];
}): PlanoFechamentoViagem {
  const elegiveis = new Map(pedidosNaSomaDaCarga(input.pedidos).map((pedido) => [pedido.numPed, pedido]));
  const marcas = new Map(input.marcas.map((marca) => [marca.alocacaoIbcId, marca]));
  const confirmados = new Set(input.confirmacoes ?? []);
  const pendentes = input.alocacoes
    .filter((alocacao) => !marcas.has(alocacao.id))
    .map((alocacao) => alocacao.identificador);
  if (pendentes.length > 0) {
    falha(409, "IBC_VIAGEM_INCOMPLETA", "Todos os IBCs da viagem precisam de destino", { pendentes });
  }

  const apontados = new Map<string, number>();
  const entradas: EntradaNoFechamento[] = [];
  const efeitos: EfeitoFechamentoIbc[] = [];
  const ficaram: FicouNaViagem[] = [];

  for (const alocacao of input.alocacoes) {
    const marca = marcas.get(alocacao.id);
    if (!marca) continue;
    if (marca.destino === "RETORNOU") {
      entradas.push({ ibcId: alocacao.ibcId, origem: "RETORNO" });
      efeitos.push({
        ibcId: alocacao.ibcId,
        alocacaoIbcId: alocacao.id,
        custodia: null,
        motivoBaixa: null,
        trocaEntradaId: null,
        encerrarAlocacao: true,
        emprestimoIniciadoEm: null,
        emprestimoVenceEm: null,
      });
      continue;
    }

    const entradaTrocaId = marca.destino === "TROCA" ? marca.ibcEntradaId : null;
    if (marca.destino === "TROCA" && !entradaTrocaId) {
      falha(409, "IBC_TROCA_SEM_ENTRADA", "Troca sem IBC de entrada", { alocacaoIbcId: alocacao.id });
    }
    const pedido = marca.numPed == null ? undefined : elegiveis.get(marca.numPed);
    const modalidade = pedido
      ? conciliacaoViagem.sugerirModalidade(pedido.quantidadeEsperadaVenda, pedido.quantidadeEsperadaEmprestimo)
      : null;
    if (!pedido || !modalidade) {
      falha(422, "IBC_CONCILIACAO_PEDIDO", "Ficou e troca exigem um pedido elegível da carga", {
        alocacaoIbcId: alocacao.id,
        numPed: marca.numPed,
      });
    }
    if (entradaTrocaId) entradas.push({ ibcId: entradaTrocaId, origem: "TROCA" });

    const emprestimo = modalidade === "EMPRESTIMO";
    efeitos.push({
      ibcId: alocacao.ibcId,
      alocacaoIbcId: alocacao.id,
      custodia: "CLIENTE",
      motivoBaixa: emprestimo ? null : "VENDA",
      trocaEntradaId: entradaTrocaId,
      encerrarAlocacao: false,
      emprestimoIniciadoEm: emprestimo ? input.now : null,
      emprestimoVenceEm: emprestimo ? conciliacaoViagem.vencimento(input.now) : null,
    });
    ficaram.push({
      ibcId: alocacao.ibcId,
      identificador: alocacao.identificador,
      modalidade,
      codCli: pedido.codCli,
      cliente: pedido.cliente,
      numPed: pedido.numPed,
    });
    apontados.set(pedido.numPed, (apontados.get(pedido.numPed) ?? 0) + 1);
  }

  const divergencias = [...elegiveis.values()].flatMap((pedido) => {
    const quantidadeApontada = apontados.get(pedido.numPed) ?? 0;
    if (quantidadeApontada === pedido.quantidadeEsperadaTotal || confirmados.has(pedido.numPed)) return [];
    return [{
      numPed: pedido.numPed,
      quantidadeEsperada: pedido.quantidadeEsperadaTotal,
      quantidadeApontada,
    }];
  });
  if (divergencias.length > 0) {
    falha(409, "IBC_DIVERGENCIA_PEDIDO", "A quantidade apontada diverge da esperada neste pedido", { divergencias });
  }

  return { entradas, efeitos, ficaram };
}
