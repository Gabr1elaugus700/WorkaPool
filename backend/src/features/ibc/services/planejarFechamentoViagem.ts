import { AppError } from "../../../utils/AppError";
import { MarcaConciliacaoSalva, RetornoSemIdSalvo } from "../repositories/IbcConciliacaoRepository";
import { conciliacaoViagem, ModalidadeConciliacaoIbc } from "../services/conciliacaoViagem";
import { AlocacaoIbcRecord, CargaPedidoIbcSnapshot } from "../types/IbcExpedicao.types";

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
  retornos: RetornoSemIdSalvo[];
}): PlanoFechamentoViagem {
  const pedidos = new Map(input.pedidos.map((pedido) => [pedido.numPed, pedido]));
  const marcas = new Map(input.marcas.map((marca) => [marca.alocacaoIbcId, marca]));
  const pendentes = input.alocacoes.filter((alocacao) => !marcas.has(alocacao.id)).map((alocacao) => alocacao.identificador);
  if (pendentes.length > 0) {
    falha(409, "IBC_VIAGEM_INCOMPLETA", "Todos os IBCs da viagem precisam de destino", { pendentes });
  }

  const trocasPorCliente = new Map<string, number>();
  const entradas: EntradaNoFechamento[] = [];
  const efeitos: EfeitoFechamentoIbc[] = [];
  const ficaram: FicouNaViagem[] = [];

  for (const alocacao of input.alocacoes) {
    const marca = marcas.get(alocacao.id);
    if (!marca) continue;
    const numPed = alocacao.numPed;
    const pedido = numPed == null ? undefined : pedidos.get(numPed);
    const chave = conciliacaoViagem.chaveCliente(pedido?.codCli ?? null, pedido?.cliente ?? "");
    if (marca.destino === "TROCA") {
      if (!marca.ibcEntradaId) falha(409, "IBC_TROCA_SEM_ENTRADA", "Troca sem IBC de entrada", { alocacaoIbcId: alocacao.id });
      trocasPorCliente.set(chave, (trocasPorCliente.get(chave) ?? 0) + 1);
      entradas.push({ ibcId: marca.ibcEntradaId, origem: "TROCA" });
      efeitos.push({
        ibcId: alocacao.ibcId,
        alocacaoIbcId: alocacao.id,
        custodia: "CLIENTE",
        motivoBaixa: "TROCA",
        trocaEntradaId: marca.ibcEntradaId,
        encerrarAlocacao: false,
        emprestimoIniciadoEm: null,
        emprestimoVenceEm: null,
      });
      continue;
    }
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
    if (marca.modalidade !== "VENDA" && marca.modalidade !== "EMPRESTIMO") {
      falha(422, "IBC_CONCILIACAO_MODALIDADE", "Ficou no cliente exige venda ou empréstimo", { alocacaoIbcId: alocacao.id });
    }
    const emprestimo = marca.modalidade === "EMPRESTIMO";
    efeitos.push({
      ibcId: alocacao.ibcId,
      alocacaoIbcId: alocacao.id,
      custodia: "CLIENTE",
      motivoBaixa: emprestimo ? null : "VENDA",
      trocaEntradaId: null,
      encerrarAlocacao: false,
      emprestimoIniciadoEm: emprestimo ? input.now : null,
      emprestimoVenceEm: emprestimo ? conciliacaoViagem.vencimento(input.now) : null,
    });
    if (numPed != null) {
      ficaram.push({
        ibcId: alocacao.ibcId,
        identificador: alocacao.identificador,
        modalidade: marca.modalidade,
        codCli: pedido?.codCli ?? null,
        cliente: pedido?.cliente ?? "",
        numPed,
      });
    }
  }

  for (const cliente of conciliacaoViagem.clientes(input.pedidos)) {
    const salvo = input.retornos.find((retorno) => retorno.chaveCliente === cliente.chaveCliente);
    if (!salvo) falha(409, "IBC_VIAGEM_INCOMPLETA", "Informe os retornos sem identificação de cada cliente", { chaveCliente: cliente.chaveCliente });
    const trocas = trocasPorCliente.get(cliente.chaveCliente) ?? 0;
    if (trocas !== salvo.quantidadePapel && !salvo.confirmouDivergencia) {
      falha(409, "IBC_TROCA_DIVERGENCIA", "A troca diverge dos retornos sem identificação do papel", {
        chaveCliente: cliente.chaveCliente,
        trocas,
        quantidadePapel: salvo.quantidadePapel,
      });
    }
  }

  return { entradas, efeitos, ficaram };
}
