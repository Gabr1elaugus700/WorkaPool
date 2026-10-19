import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { useConciliacaoViagem } from "../hooks/useConciliacaoViagem";
import type { ConciliacaoViagemDTO, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";
import CargaIbcFecharViagemEtapa from "./CargaIbcFecharViagemEtapa";

const pedido = (numPed: string, apontada: number, esperada: number): PedidoConciliacaoDTO => ({
  numPed,
  codCli: "1",
  cliente: numPed === "10" ? "Alpha" : "Beta",
  incluso: numPed === "10",
  quantidadeEsperada: esperada,
  quantidadeApontada: apontada,
});

function viagem(): ConciliacaoViagemDTO {
  return {
    codCar: 1,
    expedicaoIbcId: "exp",
    viagemFechadaEm: null,
    itens: [{
      alocacaoIbcId: "a",
      ibcId: "i",
      identificador: "HM1",
      numPed: null,
      codCli: null,
      cliente: "",
      destino: null,
      modalidade: null,
      modalidadeSugerida: null,
      ibcEntradaId: null,
    }],
    pedidos: [pedido("10", 1, 2)],
    clientes: [],
  };
}

function conciliacao(
  patch: Partial<ReturnType<typeof useConciliacaoViagem>>,
): ReturnType<typeof useConciliacaoViagem> {
  const base: ReturnType<typeof useConciliacaoViagem> = {
    viagem: null,
    loading: false,
    error: null,
    aviso: null,
    salvando: false,
    fechada: false,
    marcados: 0,
    total: 1,
    barras: [pedido("10", 1, 2)],
    divergencias: [],
    pedindoConfirmacao: false,
    podeFechar: true,
    marcarDestino: () => undefined,
    marcarPedido: () => undefined,
    vincularTroca: () => undefined,
    atualizarCliente: () => undefined,
    salvarAndamento: async () => undefined,
    fecharViagem: async () => undefined,
    confirmarFechamento: async () => undefined,
    cancelarConfirmacao: () => undefined,
  };
  return { ...base, ...patch };
}

function html(patch: Partial<ReturnType<typeof useConciliacaoViagem>> = {}): string {
  return renderToStaticMarkup(
    React.createElement(CargaIbcFecharViagemEtapa, {
      codCar: 1,
      viagem: viagem(),
      conciliacao: conciliacao(patch),
    }),
  );
}

describe("CargaIbcFecharViagemEtapa", () => {
  it("mostra a barra e fecha direto quando não há divergência", () => {
    const markup = html();
    assert.match(markup, /1 de 2/);
    assert.match(markup, /Salvar andamento/);
    assert.match(markup, /Fechar viagem/);
    assert.doesNotMatch(markup, /Confirmar e fechar|Venda|Empréstimo/);
  });

  it("pede confirmação só da divergência e deixa a viagem fechada em consulta", () => {
    const divergente = html({
      pedindoConfirmacao: true,
      divergencias: [pedido("10", 1, 2)],
    });
    assert.match(divergente, /Confirmar e fechar/);
    assert.match(divergente, /Pedido 10 · Alpha — 1 de 2/);
    assert.doesNotMatch(divergente, /Salvar andamento/);

    const fechada = html({ fechada: true });
    assert.match(fechada, /só para consulta/);
    assert.doesNotMatch(fechada, /Salvar andamento|Confirmar e fechar/);
  });
});
