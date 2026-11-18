import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React, { type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ConciliacaoViagemDTO, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";
import CargaIbcFecharViagemEtapa from "./CargaIbcFecharViagemEtapa";

const pedido = (
  numPed: string,
  overrides: Partial<PedidoConciliacaoDTO> = {},
): PedidoConciliacaoDTO => ({
  numPed,
  codCli: numPed === "10" ? "1" : "2",
  cliente: numPed === "10" ? "Alpha" : "Beta",
  incluso: numPed === "10",
  quantidadeEsperada: 2,
  quantidadeApontada: 1,
  posCar: numPed === "10" ? 2 : 1,
  gruposCodigo: ["HIPO"],
  ...overrides,
});

function viagem(): ConciliacaoViagemDTO {
  return {
    codCar: 383,
    expedicaoIbcId: "exp",
    viagemFechadaEm: null,
    chegaramAMais: 3,
    itens: [
      {
        alocacaoIbcId: "a1",
        ibcId: "i1",
        identificador: "HMH00001",
        corHex: "#2563EB",
        grupoCodigo: "HIPO",
        universal: false,
        homologado: true,
        numPed: "20",
        codCli: "2",
        cliente: "Beta",
        destino: "FICOU",
        modalidade: null,
        modalidadeSugerida: null,
        ibcEntradaId: null,
      },
      {
        alocacaoIbcId: "a2",
        ibcId: "i2",
        identificador: "NH00001",
        corHex: "#16A34A",
        grupoCodigo: null,
        universal: true,
        homologado: false,
        numPed: null,
        codCli: null,
        cliente: "",
        destino: null,
        modalidade: null,
        modalidadeSugerida: null,
        ibcEntradaId: null,
      },
      {
        alocacaoIbcId: "a3",
        ibcId: "i3",
        identificador: "HMH00002",
        corHex: "#2563EB",
        grupoCodigo: "HIPO",
        universal: false,
        homologado: true,
        numPed: null,
        codCli: null,
        cliente: "",
        destino: "RETORNOU",
        modalidade: null,
        modalidadeSugerida: null,
        ibcEntradaId: null,
      },
    ],
    pedidos: [pedido("10"), pedido("20")],
    clientes: [],
  };
}

type Props = ComponentProps<typeof CargaIbcFecharViagemEtapa>;

function html(patch: Partial<Props> = {}): string {
  const props: Props = {
    viagem: viagem(),
    grupos: [{ grupoCodigo: "HIPO", sigla: "H", corHex: "#2563EB", grupoDescricao: "Hipoclorito" }],
    chegaramAMais: "3",
    aviso: null,
    salvando: false,
    fechada: false,
    marcados: 2,
    total: 3,
    podeFechar: false,
    divergencias: [],
    pedindoConfirmacao: false,
    onAlternarDestino: () => undefined,
    onChegaramAMaisChange: () => undefined,
    onSalvar: () => undefined,
    onFechar: () => undefined,
    onConfirmarFechamento: () => undefined,
    onCancelarConfirmacao: () => undefined,
  };
  return renderToStaticMarkup(React.createElement(CargaIbcFecharViagemEtapa, { ...props, ...patch }));
}

describe("CargaIbcFecharViagemEtapa", () => {
  it("renderiza clientes por posCar, chip e amostra da preparação, barra Ficou/Troca e lista Retornou no fim", () => {
    const markup = html();
    assert.ok(markup.indexOf("Beta") < markup.indexOf("Alpha"));
    assert.match(markup, /HIPO · H Hipoclorito/);
    assert.match(markup, /Universal/);
    assert.match(markup, /Placa #2563EB/);
    assert.match(markup, /Não homologado/);
    assert.match(markup, /Incluso/);
    assert.match(markup, /Esperado: 2/);
    assert.match(markup, /Ficou: 1/);
    assert.match(markup, /Troca: 0/);
    assert.match(markup, /Retornou no caminhão/);
    assert.match(markup, /HMH00002/);
    assert.match(markup, /Chegaram a mais/);
    assert.doesNotMatch(markup, /<select|Retornos sem identificação|Registrar o IBC que entrou|Venda|Empréstimo/);
  });

  it("mantém Fechar viagem desabilitado quando falta destino e habilita quando completo", () => {
    const incompleto = html({ podeFechar: false });
    assert.match(incompleto, /<button[^>]*disabled=""[^>]*>Fechar viagem<\/button>/);

    const completo = html({ podeFechar: true });
    assert.doesNotMatch(completo, /<button[^>]*disabled=""[^>]*>Fechar viagem<\/button>/);
  });

  it("titula o 409 de produto incompatível na volta", () => {
    const markup = html({
      aviso: "O container NHCL1 é de outro produto (grupo CLORO). Este pedido aceita SODA.",
    });
    assert.match(markup, /Container de outro produto/);
    assert.match(markup, /Este pedido aceita SODA/);
  });

  it("pede confirmação só da divergência e deixa a viagem fechada e Chegaram a mais só para consulta", () => {
    const divergente = html({
      pedindoConfirmacao: true,
      divergencias: [pedido("10", { quantidadeApontada: 1, quantidadeEsperada: 2 })],
    });
    assert.match(divergente, /Confirmar e fechar/);
    assert.match(divergente, /Pedido 10 · Alpha — 1 de 2/);
    assert.doesNotMatch(divergente, /Salvar andamento/);

    const fechada = html({
      fechada: true,
      viagem: { ...viagem(), viagemFechadaEm: "2026-11-17T12:00:00.000Z" },
    });
    assert.match(fechada, /só para consulta/);
    assert.match(fechada, /id="chegaram-a-mais"[^>]*disabled=""/);
    assert.doesNotMatch(fechada, /Salvar andamento|Fechar viagem<\/button>|Confirmar e fechar|Desmarcar/);
  });
});
