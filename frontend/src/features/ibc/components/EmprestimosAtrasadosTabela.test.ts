import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { EmprestimoAtrasado } from "../types/emprestimoAtrasado.types";
import EmprestimosAtrasadosTabela from "./EmprestimosAtrasadosTabela";

function item(overrides: Partial<EmprestimoAtrasado> = {}): EmprestimoAtrasado {
  return {
    id: "6d5e4c3b-2a19-4f80-9c71-8b6a5d4e3f21",
    identificador: "HMS00001",
    cliente: "Piscina Aurora",
    codCli: "C1",
    numPed: "1120",
    codCar: 500,
    codRep: 17,
    emprestimoVenceEm: "2026-07-12T23:30:00.000Z",
    ...overrides,
  };
}

function markup(itens: EmprestimoAtrasado[]): string {
  return renderToStaticMarkup(React.createElement(EmprestimosAtrasadosTabela, { itens }));
}

describe("EmprestimosAtrasadosTabela", () => {
  it("mostra identificador, cliente, pedido, carga, representante e o dia UTC", () => {
    const html = markup([item()]);
    assert.match(html, /HMS00001/);
    assert.match(html, /Piscina Aurora/);
    assert.match(html, /1120/);
    assert.match(html, />500</);
    assert.match(html, />17</);
    assert.match(html, /Data esperada/);
    assert.match(html, /12\/07\/2026/);
    assert.doesNotMatch(html, /13\/07\/2026/);
  });

  it("cai para o código do cliente e depois para Não informado", () => {
    const comCodigo = markup([item({ cliente: null, codRep: null })]);
    assert.match(comCodigo, />C1</);
    assert.match(comCodigo, /Não informado/);
    assert.doesNotMatch(comCodigo, /Piscina Aurora/);

    const semCliente = markup([item({ cliente: null, codCli: null })]);
    assert.match(semCliente, /Não informado/);
    assert.doesNotMatch(semCliente, />C1</);
  });

  it("avisa quando não há empréstimo em atraso", () => {
    assert.match(markup([]), /Nenhum empréstimo em atraso\./);
  });
});
