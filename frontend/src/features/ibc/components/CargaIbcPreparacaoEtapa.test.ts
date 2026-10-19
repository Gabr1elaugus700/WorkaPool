import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CargaIbcPreparacaoEtapa from "./CargaIbcPreparacaoEtapa";
import type { AlocacaoIbcDTO, CargaExpedicaoDetalheDTO, PedidoIbcPreparacaoDTO } from "../types/ibcExpedicao.types";

function pedido(
  numPed: string,
  overrides: Partial<PedidoIbcPreparacaoDTO> = {},
): PedidoIbcPreparacaoDTO {
  return {
    numPed,
    cliente: "Cliente",
    quantidadeAlocada: 0,
    quantidadeEsperadaTotal: 2,
    quantidadeEsperadaVenda: 2,
    quantidadeEsperadaEmprestimo: 0,
    ibcInvalido: false,
    alocacoes: [],
    ...overrides,
  };
}

function alocacao(id: string, identificador: string): AlocacaoIbcDTO {
  return {
    id,
    ibcId: id,
    cargaId: "carga-1",
    numPed: null,
    alocadoPorId: "almox",
    alocadoEm: "2026-10-19T12:00:00.000Z",
    expedicaoIbcId: null,
    identificador,
  };
}

function detalhe(overrides: Partial<CargaExpedicaoDetalheDTO> = {}): CargaExpedicaoDetalheDTO {
  return {
    id: "carga-1",
    codCar: 101,
    destino: "Blumenau",
    situacao: "FECHADA",
    previsaoSaida: "2026-10-20T10:00:00.000Z",
    quantidadeAlocada: 1,
    quantidadeEsperadaTotal: 2,
    temExpedicao: false,
    podeFecharExpedicao: false,
    pedidos: [pedido("1120")],
    alocacoes: [alocacao("a2", "H10"), alocacao("a1", "H2")],
    ...overrides,
  };
}

function html(
  item: CargaExpedicaoDetalheDTO,
  mutationsLocked = false,
): string {
  return renderToStaticMarkup(
    React.createElement(CargaIbcPreparacaoEtapa, {
      detalhe: item,
      mutationsLocked,
      allocating: false,
      deallocatingId: null,
      substituidoNotice: null,
      onAllocate: async () => true,
      onDeallocate: async () => undefined,
    }),
  );
}

describe("CargaIbcPreparacaoEtapa", () => {
  it("lista a carga, a barra contra o total e o vínculo sem pedido", () => {
    const markup = html(detalhe());

    assert.match(markup, /Containers vinculados/);
    assert.match(markup, /1\/2/);
    assert.match(markup, /aria-valuenow="1"/);
    assert.match(markup, /aria-valuemax="2"/);
    assert.match(markup, /width:50%/);
    assert.match(markup, /H2/);
    assert.match(markup, /H10/);
    assert.ok(markup.indexOf("H2") < markup.indexOf("H10"));
    assert.match(markup, /Desvincular/);
    assert.match(markup, /id="ibc-identificador-carga"/);
    assert.match(markup, /Vincular/);
    assert.doesNotMatch(markup, /Pedido 1120/);
    assert.doesNotMatch(markup, /Venda:/);
    assert.doesNotMatch(markup, /<select/);
  });

  it("mostra o pedido misto como alerta fora do total, sem cota para preencher", () => {
    const markup = html(
      detalhe({
        quantidadeEsperadaTotal: 2,
        pedidos: [
          pedido("1120"),
          pedido("9000", {
            cliente: "Misto Ltda",
            quantidadeEsperadaTotal: 6,
            quantidadeEsperadaVenda: 3,
            quantidadeEsperadaEmprestimo: 3,
          }),
        ],
      }),
    );

    assert.match(markup, /Pedido misto fora do total/);
    assert.match(markup, /não é cota para vincular/);
    assert.match(markup, /Pedido 9000 · Misto Ltda/);
    assert.doesNotMatch(markup, /Pedido 1120/);
    assert.doesNotMatch(markup, /Venda:/);
    assert.doesNotMatch(markup, /Empréstimo:/);
  });

  it("desabilita o identificador quando a soma da carga já foi vinculada", () => {
    const markup = html(detalhe({ quantidadeAlocada: 2, quantidadeEsperadaTotal: 2 }));

    assert.match(markup, /já está vinculada/);
    assert.match(markup, /id="ibc-identificador-carga"[^>]*disabled/);
  });

  it("alerta o pedido inválido e esconde vincular e desvincular com a expedição fechada", () => {
    const markup = html(
      detalhe({
        temExpedicao: true,
        quantidadeAlocada: 2,
        quantidadeEsperadaTotal: 2,
        pedidos: [
          pedido("1121", {
            ibcInvalido: true,
            quantidadeEsperadaTotal: 0,
            quantidadeEsperadaVenda: 0,
            quantidadeEsperadaEmprestimo: 0,
          }),
        ],
      }),
      true,
    );

    assert.match(markup, /Pedido IBC inválido fora do total/);
    assert.match(markup, /Pedido 1121/);
    assert.match(markup, /Os vínculos são só consulta/);
    assert.doesNotMatch(markup, /Desvincular/);
    assert.doesNotMatch(markup, /ibc-identificador-carga/);
    assert.match(markup, /H2/);
  });
});
