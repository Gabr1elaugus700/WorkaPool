import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ConciliacaoViagemItemDTO, PedidoConciliacaoDTO } from "../types/conciliacaoViagem.types";
import ConciliacaoIbcLinha from "./ConciliacaoIbcLinha";

const pedidos: PedidoConciliacaoDTO[] = [
  { numPed: "10", codCli: "1", cliente: "Alpha", incluso: true, quantidadeEsperada: 1, quantidadeApontada: 0 },
  { numPed: "20", codCli: "2", cliente: "Beta", incluso: false, quantidadeEsperada: 2, quantidadeApontada: 0 },
];

function item(patch: Partial<ConciliacaoViagemItemDTO>): ConciliacaoViagemItemDTO {
  return {
    alocacaoIbcId: "a",
    ibcId: "i",
    identificador: "HM1",
    numPed: null,
    codCli: null,
    cliente: "",
    destino: null,
    modalidade: "VENDA",
    modalidadeSugerida: "EMPRESTIMO",
    ibcEntradaId: null,
    ...patch,
  };
}

function markup(patch: Partial<ConciliacaoViagemItemDTO>): string {
  return renderToStaticMarkup(
    React.createElement(ConciliacaoIbcLinha, {
      item: item(patch),
      pedidos,
      disabled: false,
      onDestino: () => undefined,
      onPedido: () => undefined,
    }),
  );
}

describe("ConciliacaoIbcLinha", () => {
  it("não oferece venda ou empréstimo e não herda o pedido da saída", () => {
    const html = markup({ destino: null, numPed: "999" });
    assert.doesNotMatch(html, /Venda|Empréstimo|999/);
    assert.doesNotMatch(html, /<select/);
  });

  it("pede o pedido em ficou, com badge só no incluso", () => {
    const incluso = markup({ destino: "FICOU", numPed: "10" });
    assert.match(incluso, /Incluso/);
    assert.match(incluso, /value="10"/);
    assert.doesNotMatch(incluso, /Empréstimo|Venda/);

    const emprestimo = markup({ destino: "FICOU", numPed: "20" });
    assert.doesNotMatch(emprestimo, /Incluso|Empréstimo|Venda/);
    assert.match(emprestimo, /value="20"/);

    const vazio = markup({ destino: "TROCA", numPed: null });
    assert.match(vazio, /Escolha o pedido/);
    assert.match(vazio, /value=""/);
    assert.doesNotMatch(vazio, /Incluso/);
  });

  it("retornou não escolhe pedido nem checa produto", () => {
    const html = markup({ destino: "RETORNOU", numPed: "10" });
    assert.doesNotMatch(html, /<select|Incluso|10/);
    assert.match(html, /não checa compatibilidade de produto/);

    const ficou = markup({ destino: "FICOU", numPed: "10" });
    assert.doesNotMatch(ficou, /não checa compatibilidade/);
  });
});
