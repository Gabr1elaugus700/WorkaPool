import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React, { type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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

type Props = ComponentProps<typeof CargaIbcFecharViagemEtapa>;

function html(patch: Partial<Props> = {}): string {
  const props: Props = {
    codCar: 1,
    viagem: viagem(),
    aviso: null,
    salvando: false,
    fechada: false,
    marcados: 0,
    total: 1,
    podeFechar: true,
    barras: [pedido("10", 1, 2)],
    divergencias: [],
    pedindoConfirmacao: false,
    onDestino: () => undefined,
    onPedido: () => undefined,
    onTrocaRegistrada: () => undefined,
    onClienteChange: () => undefined,
    onSalvar: () => undefined,
    onFechar: () => undefined,
    onConfirmarFechamento: () => undefined,
    onCancelarConfirmacao: () => undefined,
  };
  return renderToStaticMarkup(React.createElement(CargaIbcFecharViagemEtapa, { ...props, ...patch }));
}

describe("CargaIbcFecharViagemEtapa", () => {
  it("mostra a barra e fecha direto quando não há divergência", () => {
    const markup = html();
    assert.match(markup, /1 de 2/);
    assert.match(markup, /Salvar andamento/);
    assert.match(markup, /Fechar viagem/);
    assert.doesNotMatch(markup, /Confirmar e fechar|Venda|Empréstimo/);
    assert.match(markup, /não checa produto/);
  });

  it("titula o 409 de produto incompatível na volta", () => {
    const markup = html({
      aviso: "O container NHCL1 é de outro produto (grupo CLORO). Este pedido aceita SODA.",
    });
    assert.match(markup, /Container de outro produto/);
    assert.match(markup, /Este pedido aceita SODA/);
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
