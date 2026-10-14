import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ConciliacaoErpLista from "./ConciliacaoErpLista";
import ConciliacaoErpPainel from "./ConciliacaoErpPainel";
import type { ItemConciliacaoErp, RelatorioConciliacaoErp } from "../types/conciliacaoErp.types";

function item(overrides: Partial<ItemConciliacaoErp> = {}): ItemConciliacaoErp {
  return {
    id: "1",
    identificador: "HM1001",
    cliente: "Piscina Aurora",
    codCli: "10",
    numPed: "W100",
    emprestimoVenceEm: "2026-07-12T00:00:00.000Z",
    parIdentificador: null,
    numeroNf: null,
    baixadoEm: null,
    ...overrides,
  };
}

function relatorio(overrides: Partial<RelatorioConciliacaoErp> = {}): RelatorioConciliacaoErp {
  return {
    saldoErp: { status: "available", quantity: 200 },
    vivosWp: 187,
    residual: 13,
    buckets: [
      { bucket: "PATIO", count: 100, entraNaSoma: true },
      { bucket: "EM_VIAGEM", count: 40, entraNaSoma: true },
      { bucket: "ENTRADA", count: 7, entraNaSoma: true },
      { bucket: "NO_CLIENTE", count: 40, entraNaSoma: true },
      { bucket: "VENDIDOS", count: 8, entraNaSoma: false },
      { bucket: "TROCA", count: 2, entraNaSoma: false },
      { bucket: "BAIXADOS", count: 1, entraNaSoma: false },
      { bucket: "SUBSTITUIDOS", count: 0, entraNaSoma: false },
    ],
    serialSemNf: { recorte: "SERIAL_SEM_NF", count: 3, entraNaSoma: false },
    nfSemSerializar: { status: "indisponivel", count: null },
    itens: [],
    ...overrides,
  };
}

describe("ConciliacaoErpPainel", () => {
  it("mostra saldo, vivos, residual com sinal e a NF sem serializar indisponível", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ConciliacaoErpPainel, {
        relatorio: relatorio(),
        onSelecionar: () => undefined,
      }),
    );
    assert.match(markup, /Saldo ERP/);
    assert.match(markup, />200</);
    assert.match(markup, /Vivos no WorkaPool/);
    assert.match(markup, />187</);
    assert.match(markup, /Gap residual \(ERP − vivos\)/);
    assert.match(markup, />\+13</);
    assert.match(markup, /NF sem serializar/);
    const nf = markup.slice(markup.indexOf("nf-sem-serializar"));
    assert.match(nf, /indisponível/);
    assert.match(nf, /não entra na soma/);
    assert.doesNotMatch(nf, />0</);
    assert.match(markup, /Vendidos[\s\S]*não entra na soma/);
    assert.doesNotMatch(markup, /atras/i);
  });

  it("não zera o residual quando o saldo do ERP está indisponível", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ConciliacaoErpPainel, {
        relatorio: relatorio({
          saldoErp: { status: "unavailable" },
          residual: null,
        }),
        onSelecionar: () => undefined,
      }),
    );
    assert.match(markup, /Saldo ERP[\s\S]*indisponível/);
    assert.match(markup, /Gap residual \(ERP − vivos\)[\s\S]*indisponível/);
    assert.doesNotMatch(markup, /Gap residual \(ERP − vivos\)[\s\S]{0,80}>0</);
  });
});

describe("ConciliacaoErpLista", () => {
  it("lista o empréstimo com vencimento e sem marca de atraso", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ConciliacaoErpLista, {
        bucket: "NO_CLIENTE",
        itens: [item()],
      }),
    );
    assert.match(markup, /HM1001/);
    assert.match(markup, /Piscina Aurora/);
    assert.match(markup, /W100/);
    assert.match(markup, /Vencimento do empréstimo/);
    assert.match(markup, /12\/07\/2026/);
    assert.doesNotMatch(markup, /atras/i);
  });

  it("avisa quando o grupo não tem IBC", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ConciliacaoErpLista, { bucket: "PATIO", itens: [] }),
    );
    assert.match(markup, /Nenhum IBC neste grupo\./);
  });
});
